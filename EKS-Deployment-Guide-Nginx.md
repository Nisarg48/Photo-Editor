## 1. Create Cluster on EKS
```sh
eksctl create cluster \
    --name development-cluster \
    --region ap-southeast-2 \
    --fargate
```
takes ~15-20 minutes, let it finish

## 2. Create Namespace in Data Plane
```sh
kubectl apply -f namespace.yaml
```

## 3. Create Fargate Profile for same Namespace so all pod use Fargate
```sh
eksctl create fargateprofile \
    --cluster development-cluster \
    --region ap-southeast-2 \
    --name photo-editor \
    --namespace photo-editor 
```
takes 1-2 minutes

## 4. Deploy Deployment/Pod on EKS Cluster
```sh
kubectl apply -f deployment.yaml
```
```sh
kubectl get pods -n photo-editor -w
```
```sh
# if Pending 
kubectl describe pod <pod-name> -n photo-editor
```

## 5. Deploy Service on EKS Cluster
```sh
kubectl apply -f service.yaml
```

## 6. Create Fargate Profile for Ingress Controller
```sh
eksctl create fargateprofile \
    --cluster development-cluster \
    --region ap-southeast-2 \
    --name ingress-nginx \
    --namespace ingress-nginx
```
takes 1-2 minutes

## 7. Install nginx controller on EKS
```sh
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
```
```sh
helm install ingress-nginx ingress-nginx/ingress-nginx \
    -n ingress-nginx --create-namespace \
    --set controller.service.type=LoadBalancer
```
```sh
# debug: confirm nginx pod is Running
kubectl get pods -n ingress-nginx -w
```

## 8. Deploy Ingress on EKS Cluster
```sh
kubectl apply -f ingress-nginx.yaml
```

## 9. Access Application using Public Address
```sh
kubectl get svc -n ingress-nginx ingress-nginx-controller
```
```text
look at the EXTERNAL-IP column, then open http://<that address> in a browser
curl http://<that address>
```

## 10. Create the IAM policy the AWS Load Balancer Controller needs
```sh
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
```
```sh
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json
```

## 11. Get AWS Account ID
```sh
aws sts get-caller-identity \
    --query Account \
    --output text
```
save as <YOUR_ACCOUNT_ID>, reused in step 14 and 24

## 12. Create an EC2 Node Group to host the Controller (no IRSA/OIDC needed)
```sh
eksctl create nodegroup \
    --cluster development-cluster \
    --region ap-southeast-2 \
    --name controller-ng \
    --node-type t3.small \
    --nodes 1 \
    --nodes-min 1 \
    --nodes-max 1 \
    --managed
```
```sh
# debug: confirm the new EC2 node joined
kubectl get nodes -o wide
```

## 13. Get the Node Group's IAM Role Name
```sh
aws eks describe-nodegroup \
    --cluster-name development-cluster \
    --nodegroup-name controller-ng \
    --region ap-southeast-2 \
    --query "nodegroup.nodeRole" \
    --output text
```
```text
the output is a full ARN — take just the part after the last "/" as <NODE_ROLE_NAME> for the next step
```

## 14. Attach the IAM Policy directly to the Node Group's Role
```sh
aws iam attach-role-policy \
    --role-name <NODE_ROLE_NAME> \
    --policy-arn arn:aws:iam::<YOUR_ACCOUNT_ID>:policy/AWSLoadBalancerControllerIAMPolicy
```

## 15. Get VPC ID of EKS Cluster
```sh
aws eks describe-cluster \
    --name development-cluster \
    --region ap-southeast-2 \
    --query "cluster.resourcesVpcConfig.vpcId" \
    --output text
```

## 16. Install the AWS Load Balancer Controller itself, via Helm — into its own namespace, forced onto the EC2 node
```sh
helm repo add eks https://aws.github.io/eks-charts
```
```sh
helm repo update
```
```sh
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n aws-lb-controller --create-namespace \
    --set clusterName=development-cluster \
    --set serviceAccount.create=true \
    --set region=ap-southeast-2 \
    --set vpcId=<YOUR_VPC_ID> \
    --set nodeSelector."eks\.amazonaws\.com/compute-type"=ec2
```
```sh
kubectl get pods -n aws-lb-controller -w
```
```sh
# if Pending: 
kubectl describe pod <pod-name> -n aws-lb-controller
# and: 
kubectl get nodes --show-labels | grep compute-type
```
```text
confirm the pod is Running and its NODE column shows your new EC2 node, not stuck Pending
```

## 17. Upgrade existing Nginx Helm release
```sh
helm upgrade ingress-nginx ingress-nginx/ingress-nginx \
    -n ingress-nginx \
    --set controller.service.type=LoadBalancer \
    --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"=external \
    --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-nlb-target-type"=ip \
    --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-scheme"=internet-facing
```
controller needs about a minute to notice the Service and create the NLB
```sh
# debug: confirm target is healthy before testing curl
aws elbv2 describe-target-groups \
    --region ap-southeast-2 \
    --query "TargetGroups[].TargetGroupArn" \
    --output text
```
```sh
aws elbv2 describe-target-health \
    --region ap-southeast-2 \
    --target-group-arn <TARGET_GROUP_ARN>
# look for "State": "healthy"
```

## 18. Access Application using Public Address
```sh
kubectl get svc -n ingress-nginx ingress-nginx-controller
```
```sh
# look at the EXTERNAL-IP column, then open http://<that address> in a browser
curl -v --max-time 10 http://<EXTERNAL-IP>
```

## 19. Remove Ingress from EKS
```sh
kubectl delete ingress photo-editor-ingress -n photo-editor
```

## 20. Remove Service from EKS
```sh
kubectl delete svc photo-editor-service -n photo-editor
```

## 21. Remove Deployment/Pod from EKS
```sh
kubectl delete deployment photo-editor-deployment -n photo-editor
```

## 22. Remove nginx Controller from EKS
```sh
helm uninstall ingress-nginx -n ingress-nginx
```
```sh
aws elbv2 describe-load-balancers \
    --region ap-southeast-2 \
    --query "LoadBalancers[].LoadBalancerName"
```

## 23. Remove AWS LB Controller from EKS
```sh
helm uninstall aws-load-balancer-controller -n aws-lb-controller
```

## 24. Detach the IAM Policy from the Node Group's Role
```sh
aws iam detach-role-policy \
    --role-name <NODE_ROLE_NAME> \
    --policy-arn arn:aws:iam::<YOUR_ACCOUNT_ID>:policy/AWSLoadBalancerControllerIAMPolicy
```

## 25. Delete the Controller's EC2 Node Group
```sh
eksctl delete nodegroup \
    --cluster development-cluster \
    --region ap-southeast-2 \
    --name controller-ng
```

## 26. Remove Controller Fargate Profile from EKS
```sh
eksctl delete fargateprofile \
    --name ingress-nginx \
    --cluster development-cluster \
    --region ap-southeast-2
```

## 27. Remove Fargate Profile from EKS
```sh
eksctl delete fargateprofile \
    --name photo-editor \
    --cluster development-cluster \
    --region ap-southeast-2
```

## 28. Remove Controller Namespace from EKS
```sh
kubectl delete namespace ingress-nginx
```

## 29. Remove AWS LB Controller Namespace from EKS
```sh
kubectl delete namespace aws-lb-controller
```

## 30. Remove Namespace from EKS
```sh
kubectl delete namespace photo-editor
```

## 31. Delete Cluster from EKS
```sh
eksctl delete cluster \
    --name development-cluster \
    --region ap-southeast-2
```