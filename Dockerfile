FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY CSS /usr/share/nginx/html/CSS
COPY JS /usr/share/nginx/html/JS

EXPOSE 80  