# Change this to your go basic dir
export GOPATH=/home/sites/go

# 1. Clean all .so if any
echo "Deletes all the old .so"
find . -name "*.so*" -exec rm {} \;

# 2. recompile app.so example
echo "Rebuild app.so (user application for site)"
cd example/app
go build --buildmode=plugin app.go
cd ../..

echo "Rebuild box.so (user engine)"
cd example/box
go build --buildmode=plugin box.go
cd ../..

echo "Run the xamboo"
go run xamboo.go --config=example/config.json
# once compiled, use this:
# ./xamboo --config=example/config.json
