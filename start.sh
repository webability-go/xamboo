# Change this to your go basic dir
export GOPATH=/home/sites/go

# 1. Clean all .so if any
echo "Deletes all the old .so"
find . -name "*.so*" -exec rm {} \;

# 2. recompile master/app so the master works
echo "Rebuild master/app/app.so (application for master)"
cd master/app
go build --buildmode=plugin app.go
cd ../..

# 3. recompile example/app example library
echo "Rebuild app.so (user application for site)"
cd example/app
go build --buildmode=plugin app.go
cd ../..

# 4. recompile example/engines/box example library
echo "Rebuild box.so (user engine)"
cd example/engines/box
go build --buildmode=plugin box.go
cd ../../..

echo "Run the xamboo"
go run xamboo.go --config=example/config.json
# once compiled, use this:
# ./xamboo --config=example/config.json
