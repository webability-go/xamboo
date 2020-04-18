package main

import (
	"bufio"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/webability-go/xamboo/server"
	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/config"
)

const VERSION = "1.0.0"

func init() {
	fmt.Println("Master APP Main SO library initialized, VERSION =", VERSION)
}

func Start(h config.Host) {
}

func GetMD5Hash(text string) string {
	hasher := md5.New()
	hasher.Write([]byte(text))
	return hex.EncodeToString(hasher.Sum(nil))
}

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

// CreateKey Creates a string of random chars and digits of length
//   chartype = -1: lowers, uppers and digits
//   chartype = 0: only digits
//   chartype = 1 only uppers
//   chartype = 2 only lowers
func CreateKey(length int, chartype int) string {
	rand.Seed(time.Now().UnixNano())
	result, rd := "", 0
	for i := 0; i < length; i++ {
		if chartype == -1 {
			rd = rand.Intn(3)
		} else {
			rd = chartype
		}
		key := 0
		switch rd {
		case 0:
			key = 48 + rand.Intn(10)
		case 1:
			key = 65 + rand.Intn(26)
		case 2:
			key = 97 + rand.Intn(26)
		}
		result += string(key)
	}
	return result
}
