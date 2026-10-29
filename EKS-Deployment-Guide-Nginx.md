

## Create Cluster on EKS
```sh
eksctl create cluster \
    --name development-cluster \
    --region ap-south-1 \
    --fargate
```

## Create Namespace in Data Plane
```sh
kubectl apply -f namespace.yaml
```

## Create Fargate Profile for same Namespace so all pod use Fargate
```sh
eksctl create fargateprofile \
    --cluster development-cluster \
    --region ap-south-1 \
    --name photo-editor \
    --namespace photo-editor 
```

## Deploy Deployment/Pod on EKS Cluster
```sh
kubectl apply -f deployment.yaml
```

## Deploy Service on EKS Cluster
```sh
kubectl apply -f service.yaml
```

## Create Fargate Profile for Ingress Controller
```sh
eksctl create fargateprofile \
    --cluster development-cluster \
    --region ap-south-1 \
    --name ingress-nginx \
    --namespace ingress-nginx
```

## Install nginx controller on EKS
```sh
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
```
```sh
helm install ingress-nginx ingress-nginx/ingress-nginx \
    -n ingress-nginx --create-namespace \
    --set controller.service.type=LoadBalancer
```

## Deploy Ingress on EKS Cluster
```sh
kubectl apply -f ingress-nginx.yaml
```

## Access Application using Public Address
```sh
kubectl get svc -n ingress-nginx ingress-nginx-controller
```
```text
look at the EXTERNAL-IP column, then open http://<that address> in a browser
curl http://<that address>
```

## Remove Ingress from EKS
```sh
kubectl delete ingress photo-editor-ingress -n photo-editor
```

## Remove Service from EKS
```sh
kubectl delete svc photo-editor-service -n photo-editor
```

## Remove Deployment/Pod from EKS
```sh
kubectl delete deployment photo-editor-deployment -n photo-editor
```

## Remove nginx Controller from EKS
```sh
helm uninstall ingress-nginx -n ingress-nginx
```

## Remove Controller Fargate Profile from EKS
```sh
eksctl delete fargateprofile \
    --name ingress-nginx \
    --cluster development-cluster \
    --region ap-south-1
```

## Remove Fargate Profile from EKS
```sh
eksctl delete fargateprofile \
    --name photo-editor \
    --cluster development-cluster \
    --region ap-south-1
```

## Remove Controller Namespace from EKS
```sh
kubectl delete namespace ingress-nginx
```

## Remove Namespace from EKS
```sh
kubectl delete namespace photo-editor
```

## Delete Cluster from EKS
```sh
eksctl delete cluster \
    --name development-cluster \
    --region ap-south-1
```