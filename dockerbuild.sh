#/bin/sh
VERSION='0.1.0'
tsc
docker build -t zdid2/arexx2hass:${VERSION} .
docker push zdid2/arexx2hass:${VERSION}
docker tag zdid2/arexx2hass:${VERSION} zdid2/arexx2hass:latest
docker push zdid2/arexx2hass:latest
echo "Docker build finished"
#