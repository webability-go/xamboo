package main

import (
	"bufio"
	"io/ioutil"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/webability-go/xamboo/server"
	"github.com/webability-go/xamboo/server/assets"
)

func VerifyLogin(ctx *assets.Context) {

	// Any sent session ?
	sessionid := ""
	cookiename, _ := ctx.Sysparams.GetString("cookiename")
	cookie, _ := ctx.Request.Cookie(cookiename)
	// 1.bis If there is no cookie, there is no session
	if cookie != nil && len(cookie.Value) != 0 {
		sessionid = cookie.Value
	}
	IP := ctx.Writer.(*server.CoreWriter).RequestStat.IP

	// verify username, password, OrderSecurity connect/disconnect
	order := ctx.Request.Form.Get("OrderSecurity")

	switch order {
	case "Connect":
		username := ctx.Request.Form.Get("username")
		password := ctx.Request.Form.Get("password")
		// verify against config data
		md5password := GetMD5Hash(password)

		sysusername, _ := ctx.Sysparams.GetString("username")
		syspassword, _ := ctx.Sysparams.GetString("password")

		if sysusername == username && syspassword == md5password {
			// Connect !
			sessionid = CreateSession(ctx, sessionid, IP)
		} else {
			// Disconnect !
			DestroySession(ctx, sessionid)
			return
		}
	case "Disconnect":
		DestroySession(ctx, sessionid)
		return
	}

	if sessionid == "" { // there is no session
		return
	}
	sessiondata := ReadSession(ctx, sessionid)
	if sessiondata == nil {
		return
	}

	checkIP, _ := ctx.Sysparams.GetBool("checkip")
	sessionip := sessiondata["ip"]
	if checkIP && IP != sessionip {
		DestroySession(ctx, sessionid)
		return
	}

	// set user data
	ctx.Sessionparams.Set("sessionid", sessionid)
	ctx.Sessionparams.Set("userkey", sessiondata["userkey"])
	ctx.Sessionparams.Set("username", sessiondata["username"])
}

func ReadSession(ctx *assets.Context, sessionid string) map[string]string {

	rd, _ := ctx.Sysparams.GetString("resourcesdir")
	path := rd + "/sessions/" + sessionid + ".conf"

	data := map[string]string{}
	fdata, _ := ioutil.ReadFile(path)

	if len(fdata) == 0 {
		return nil
	}

	scanner := bufio.NewScanner(strings.NewReader(string(fdata)))
	for scanner.Scan() {
		ldata := scanner.Text()
		xdata := strings.Split(ldata, "=")
		if len(xdata) == 2 {
			data[xdata[0]] = xdata[1]
		}
	}
	if err := scanner.Err(); err != nil {
		return nil
	}
	return data
}

func WriteSession(ctx *assets.Context, sessionid string, data map[string]string) {

	rd, _ := ctx.Sysparams.GetString("resourcesdir")
	path := rd + "/sessions/" + sessionid + ".conf"

	local := ""
	for id, val := range data {
		local += id + "=" + val + "\n"
	}
	ioutil.WriteFile(path, []byte(local), 0644)
}

func CreateSession(ctx *assets.Context, sessionid string, IP string) string {

	cookiesize, _ := ctx.Sysparams.GetInt("cookiesize")

	match, _ := regexp.MatchString("[a-zA-Z0-9]{24}", sessionid)
	if !match {
		sessionid = CreateKey(cookiesize, -1)
	}

	userkey := "1"
	username, _ := ctx.Sysparams.GetString("username")

	cookiename, _ := ctx.Sysparams.GetString("cookiename")
	http.SetCookie(ctx.Writer, &http.Cookie{Name: cookiename, Value: sessionid, Path: "/"})

	data := map[string]string{
		"userkey":  userkey,
		"username": username,
		"ip":       IP,
	}

	WriteSession(ctx, sessionid, data)

	return sessionid
}

func DestroySession(ctx *assets.Context, sessionid string) {

	cookiename, _ := ctx.Sysparams.GetString("cookiename")

	http.SetCookie(ctx.Writer, &http.Cookie{Name: cookiename, Value: "", Path: "/", MaxAge: -1})

	// deletes file
	rd, _ := ctx.Sysparams.GetString("resourcesdir")
	path := rd + "/sessions/" + sessionid + ".conf"
	os.Remove(path)
}
