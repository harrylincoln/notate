 #!/bin/bash
~/bin/aws ecr get-login --no-include-email --region us-east-1 | /bin/bash
docker build -t notate .
docker tag notate:latest $1
docker push $1