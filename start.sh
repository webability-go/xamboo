# Change this to your go basic dir
export GOPATH=/home/sites/go

# 1. Clean all .so if any
echo "Deletes all the old .so"
find . -name "*.so*" -exec rm {} \;

# 2. recompile app.so example
echo "Rebuild app.so (user application for site)"
cd example/app
go build -race --buildmode=plugin app.go
cd ../..
pwd
echo "Rebuild box.so (user engine)"
cd example/engines/box
go build -race --buildmode=plugin box.go
cd ../../..
pwd
echo "Run the xamboo"
go run -race xamboo.go --config=example/config.json
# once compiled, use this:
# ./xamboo --config=example/config.json
