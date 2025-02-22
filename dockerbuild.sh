#/bin/sh
VERSION=`cat package.json | jq -r .version`
export VERSION
tsc
docker compose build 
docker push zdid2/arexx2hass:${VERSION}
docker tag zdid2/arexx2hass:${VERSION} zdid2/arexx2hass:latest
docker push zdid2/arexx2hass:latest
echo "Docker build finished"
#
