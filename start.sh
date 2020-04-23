# Change this to your go basic dir
export GOPATH=/home/sites/go

# 1. Clean all .so if any
echo "Deletes all the old .so"
find . -name "*.so*" -exec rm {} \;

# 2. recompile master/app so the master works
echo "Rebuild master/app/app.so (application for master)"
go build --buildmode=plugin -o master/app/app.so master/app/*.go

# 3. recompile example/app example library
echo "Rebuild app.so (user application for site)"
go build --buildmode=plugin -o example/app/app.so example/app/*.go

# 4. recompile example/engines/box example library
echo "Rebuild box.so (user engine)"
go build --buildmode=plugin -o example/engines/box/box.so example/engines/box/*.go

echo "Run the xamboo"
go run xamboo.go --config=mainconfig.json
# once compiled, use this:
# ./xamboo --config=example/config.json
