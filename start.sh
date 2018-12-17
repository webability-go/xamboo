# Change this to your go basic dir
export GOPATH=/home/sites/go

# 1. Clean all .so if any
find . -name "*.so*" -exec rm {} \;

# 2. recompile app.so example
cd example/app
go build --buildmode=plugin app.go
cd ../..

go run xamboo.go --config=example/config.json
# once compiled, use this:
# ./xamboo --config=example/config.json
