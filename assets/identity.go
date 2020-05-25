package assets

type Identity struct {
	Version  string
	Language string
}

func (i *Identity) Stringify() string {
	id := ""
	if len(i.Version) > 0 {
		id += "." + i.Version
	}
	if len(i.Language) > 0 {
		id += "." + i.Language
	}

	return id
}
