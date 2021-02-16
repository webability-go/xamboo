package context

/* A wrapper to the code/engine (reentrant code)
   parameters:
   - engine pointer, (directly passed thought to the wrapper if needed)
   - Inner Page to call,
   - Parameters,
   - Language,
   - Version
   - Method (GET, POST, PUT, DELETE..)
*/
var EngineWrapperString func(interface{}, string, interface{}, string, string, string) string
var EngineWrapper func(interface{}, string, interface{}, string, string, string) interface{}
