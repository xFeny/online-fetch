/**
 * JSON 转Java实体
 */
module.exports = {
    _allClass: [],
    _genClassCode: function (obj, name = "Root", package = "ink.feny.example") {
        let clas = "";
        let str = "";
        let privateAttr = ""
        for (let n in obj) {
            let v = obj[n];
            n = n.trim();
            //变量定义规则
            n = n.replace(/[^\w]+/ig, '_');
            if (/^\d+/.test(n))
                n = "_" + n;
            let tp = this._genTypeByProp(n, v, package);
            let _type = tp.type;
            if (tp.islist) {
                str = `package ${package};\nimport java.util.List;\nimport lombok.Data;\n\n@Data\npublic class ${name} {\n
                `
            }
            privateAttr += `\tprivate ${_type} ${n};\n\n`;
        }

        if (!str) {
            clas += `package ${package};\nimport lombok.Data;\n\n@Data\npublic class ${name} {\n`;
        }
        else
            clas += str;
        clas += privateAttr;
        // clas += publicAttr;
        clas += "}\n\n";
        this._allClass.push(clas);
        return this._allClass.join("\n");
    },
    _genTypeByProp: function (name, val, package) {
        try {
            if (typeof val == "string") {
                //xxxx(-|/|年)xx(-|/|月)xx(-|/|日) xx:xx:xx
                let regdt = /^(\d{4})(-|\/|年)(\d{2})(-|\/|月)(\d{2})(日)?(\s((\d{1,2}):)?((\d{1,2}):)?(\d{1,2})?)?$/
                if (regdt.test(val.trim()))
                    val = new Date(val);
            }
        } catch (e) {

        }
        switch (Object.prototype.toString.apply(val)) {
            case "[object Number]":
                {
                    return { type: val.toString().indexOf(".") > -1 ? "double" : "int" };
                }
            case "[object Date]":
                {
                    return { type: "DateTime" };
                }
            case "[object Object]":
                {
                    name = name.substring(0, 1).toUpperCase() + name.substring(1);
                    this._genClassCode(val, name, package);
                    return { type: name };
                }
            case "[object Array]":
                {
                    return { type: `List<${this._genTypeByProp(name, val[0], package).type}>`, islist: true };
                }
            case "[object Boolean]":
                {
                    return { type: "boolean" };
                }
            default:
                {
                    return { type: "String" };
                }
        }
    },
    convert: function (jsonObj, package) {
        this._allClass = [];
        return this._genClassCode(jsonObj, 'Root', package);
    },
}