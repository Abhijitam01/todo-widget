#!/bin/bash
echo "Starting Errika todo Development"
echo "Building the typescript"
npm run build

if [ $? -eq 0 ];then
    echo "Build Successfull"
    echo "Starting Electron App"
    npm start
else 
    echo "build failed"
    exit 1
fi

 