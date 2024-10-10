const express = require('express');
const JsonToTS = require('json-to-ts')
const JsonToGo = require('json-to-go')
const jsonToJava = require('../common/jsonToJava');
const fs = require('fs');

const router = express.Router();


// jsonToJava = {
//     _allClass: [],
//     _genClassCode: function (obj, name) {
//         var packageval = "com.esjson"
//         var clas = "";
//         var str = "";
//         var privateAttr = "", publicAttr = ""
//         for (var n in obj) {
//             var v = obj[n];
//             n = n.trim();
//             //变量定义规则
//             n = n.replace(/[^\w]+/ig, '_');
//             if (/^\d+/.test(n))
//                 n = "_" + n;
//             var tp = this._genTypeByProp(n, v);
//             var _type = tp.type;
//             if (tp.islist) {
//                 str = `package ${packageval};\n\nimport java.util.List;\nimport lombok.Data;\n\n@Data\npublic class ${name || "Root"} {\n
//                 `
//             }
//             privateAttr += `\tprivate ${_type} ${n};\n\n`;
//         }

//         if (!str) {
//             clas += `package ${packageval};\nimport lombok.Data;\n\n@Data\npublic class ${name || "Root"} {\n`;
//         }
//         else
//             clas += str;
//         clas += privateAttr;
//         // clas += publicAttr;
//         clas += "}\n";
//         this._allClass.push({name: name || "Root", clas});
//         return this._allClass.join("\n");
//     },
//     _genTypeByProp: function (name, val) {
//         try {
//             if (typeof val == "string") {
//                 //xxxx(-|/|年)xx(-|/|月)xx(-|/|日) xx:xx:xx
//                 var regdt = /^(\d{4})(-|\/|年)(\d{2})(-|\/|月)(\d{2})(日)?(\s((\d{1,2}):)?((\d{1,2}):)?(\d{1,2})?)?$/
//                 if (regdt.test(val.trim()))
//                     val = new Date(val);
//             }
//         } catch (e) {

//         }
//         switch (Object.prototype.toString.apply(val)) {
//             case "[object Number]":
//                 {
//                     return { type: val.toString().indexOf(".") > -1 ? "double" : "int" };
//                 }
//             case "[object Date]":
//                 {
//                     return { type: "DateTime" };
//                 }
//             case "[object Object]":
//                 {
//                     name = name.substring(0, 1).toUpperCase() + name.substring(1);
//                     this._genClassCode(val, name);
//                     return { type: name };
//                 }
//             case "[object Array]":
//                 {
//                     return { type: `List<${this._genTypeByProp(name, val[0]).type}>`, islist: true };
//                 }
//             case "[object Boolean]":
//                 {
//                     return { type: "boolean" };
//                 }
//             default:
//                 {
//                     return { type: "String" };
//                 }
//         }
//     },
//     convert: function (jsonObj) {
//         this._allClass = [];
//         return this._genClassCode(jsonObj);
//     },
// }


/**
 * JSON 转换为Typescript
 */
router.post('/jsonToTS', (req, res) => {
    // 获取POST请求体中的数据
    let json = req.body;
    console.log(json)
    if (!json) {
        res.send('JSON不能为空')
        return
    }

    let content = ''
    JsonToTS(json).forEach(typeInterface => {
        content += 'export ' + typeInterface + '\n'
    })
    res.send(content)
})
/**
 * JSON 转换为GO
 */
router.post('/jsonToGO', (req, res) => {
    // 获取POST请求体中的数据
    let json = req.body;
    if (!json) {
        res.send('JSON不能为空')
        return
    }

    const convert = JsonToGo(JSON.stringify(json), "", true, false, false);
    res.send(convert.go)
})


router.post('/jsonToJava', (req, res) => {
    // 获取POST请求体中的数据
    let {json, package} = req.body;
    if (!json) {
        res.send('JSON不能为空')
        return
    }
    

    const convert = jsonToJava.convert(json, package)
    res.send(convert)
})

module.exports = router;