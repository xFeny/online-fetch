/**
 * JSON 转Java实体
 */

function trimStr(str) {
  return str.replace(/(^\s*)|(\s*$)/g, "");
}

function isArray(o) {
  return Object.prototype.toString.call(o) === "[object Array]";
}

function camelCase(input) {
  return input;
  /* return input.toLowerCase().replace(/_(.)/g, function(match, group1) {
	     return group1.toUpperCase();
	 });*/
}

function camelCaseWithFirstCharUpper(input) {
  if (!input) {
    return "";
  }
  input = camelCase(input);
  return input[0].toUpperCase() + input.substr(1);
}

function isDate(date) {
  var isDate = new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) && isNaN(+date);
  return isDate;
}

function isInt(n) {
  return n % 1 === 0;
}

function merge(first, second) {
  var l = second.length,
    i = first.length,
    j = 0;
  // second可以是一个对象
  if (typeof l === "number") {
    // 如果second是数组
    for (; j < l; j++) first[i++] = second[j];
  } else {
    // 如果second不是数组
    while (second[j] !== undefined) first[i++] = second[j++];
  }
  first.length = i;
  return first;
}

////////////////////////////////

var importMap = {
  Date: "java.util.Date",
  List: "java.util.List",
};

/**
 * 把本程序定义的数据格式，转换为java bean文本
 * @param bean
 * @returns {string}
 */
function toBeanText(bean, packageName) {
  var beanFields = bean.val;
  var className = bean.name;

  var importText = "";
  var fieldText = "";
  var typeSet = {};
  var shoudImportJackson = false;

  //依次遍历每个属性
  for (let key in beanFields) {
    //如果存在下划线小写格式的属性名，要改成驼峰命名
    var camelKey = camelCase(key);
    if (camelKey != key) {
      //标准要用Jackson工具包做转换
      fieldText += '    @JsonProperty("' + key + '")\n';
      shoudImportJackson = true;
    }

    //生成属性定义
    fieldText += "\tprivate " + beanFields[key] + " " + camelKey + ";\n\n";
    //记录属性类型,beanFields[key]可能有一些值，是List<Date>之类，要替换成Date
    var type = beanFields[key];
    if (type.indexOf("List<") > -1) {
      type = beanFields[key].replace("List<", "");
      type = type.replace(">", "");
      typeSet["List"] = "true";
    }
    typeSet[type] = "true";
  }

  //生成import语句
  for (let t in typeSet) {
    if (importMap[t]) {
      importText += "import " + importMap[t] + ";\n";
    }
  }
  if (shoudImportJackson) {
    importText +=
      "import org.codehaus.jackson.annotate.JsonIgnoreProperties;\nimport org.codehaus.jackson.annotate.JsonProperty;";
  }
  if (packageName) {
    importText =
      "package " +
      packageName +
      ";\nimport lombok.Data;\nimport lombok.NoArgsConstructor;\nimport lombok.AllArgsConstructor;\n" +
      importText;
  }

  //把import,属性定义，setter，getter拼到一起，就是一个完整的java bean了
  return (
    importText +
    "\n@Data\n@NoArgsConstructor\n@AllArgsConstructor\npublic class " +
    className +
    " {\n\n" +
    fieldText +
    "}"
  );
}

/**
 * 解析Json，返回json中包含的属性、属性类型
 * @param text
 * @returns {{}}
 */
function getBeanFieldFromJson(text, className, type, typeCase) {
  //1.先将文本转换成json实体
  var jsonObject = null;

  //一些容错配置
  //把首尾空格去掉，那么如果第一和最后一个字符为[]，说明是json数组，而非对象
  text = trimStr(text);
  try {
    jsonlint.parse(text);
  } catch (e) {}

  if (text[0] === "[" && text[text.length - 1] === "]") {
    text = '{ "list": ' + text + "}";
    //如果是数组，则默认去数组第一个元素
    jsonObject = JSON.parse(text).list[0];
  } else {
    jsonObject = JSON.parse(text);
  }

  //2.将json对象转换成bean类
  var bean = {};
  var attrClassAry = [];
  for (let key in jsonObject) {
    var val = jsonObject[key];
    var newKey = key;
    switch (type) {
      case "1":
        newKey = lineToHump(key);
        break;
      case "2":
        newKey = humpToLine(key);
        if (typeCase) {
          if (typeCase === "2") {
            newKey = newKey.toUpperCase();
          } else if (typeCase === "1") {
            newKey = newKey.toLowerCase();
          }
        }
        break;
      default:
        break;
    }
    bean[newKey] = getTypeFromJsonVal(val, newKey, attrClassAry, type, typeCase);
  }
  if (!className) {
    className = "JsonToBean";
  }
  bean = {
    name: className,
    val: bean,
  };

  return merge([bean], attrClassAry);
}

// 下划线转换驼峰
function lineToHump(name) {
  var html = name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
  return html;
}

// 驼峰转换下划线
function humpToLine(name) {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/**
 * 从json 属性值中判断该值的数据类型
 * @param val
 * @returns {string}
 */
function getTypeFromJsonVal(val, key, attrClassAry, type, typeCase) {
  //去掉空格，以避免一些无谓的转换错误
  if (val && val.replace) {
    //val =  val.replace(/ /g, "");
    val = trimStr(val);
  }
  var typeofStr = typeof val;
  if (typeofStr === "number") {
    if (isInt(val)) {
      return val < 65536 ? "int" : "long";
    } else {
      return "double";
    }
  } else if (typeofStr === "boolean") {
    return typeofStr;
  } else if (isDate(val)) {
    return "Date";
  } else if (!val) {
    return "String";
  } else if (typeofStr === "string") {
    return "String";
  } else {
    if (isArray(val)) {
      var type = getTypeFromJsonVal(val[0], key, attrClassAry);
      if (type == "int") {
        type = "Integer";
      } else if (type == "long") {
        type = "Long";
      } else if (type == "float") {
        type = "Float";
      } else if (type == "double") {
        type = "Double";
      }
      return "List<" + type + ">";
    } else {
      //会走到这里，说明属性值是个json，说明属性类型是个自定义类
      var typeName = camelCaseWithFirstCharUpper(key);
      var bean = {};
      for (key in val) {
        var fieldValue = val[key];
        var newKey = key;
        switch (type) {
          case "1":
            newKey = lineToHump(key);
            break;
          case "2":
            newKey = humpToLine(key);
            if (typeCase) {
              if (typeCase === "2") {
                newKey = newKey.toUpperCase();
              } else if (typeCase === "1") {
                newKey = newKey.toLowerCase();
              }
            }
            break;
          default:
            break;
        }
        bean[newKey] = getTypeFromJsonVal(fieldValue, newKey, attrClassAry, type, typeCase);
      }
      attrClassAry.push({
        name: typeName,
        val: bean,
      });
      return typeName;
    }
  }
}

function jsonToJavaBean(json, packageName = "ink.feny") {
  const beanField = getBeanFieldFromJson(json);
  const bean = [];
  for (let key in beanField) {
    bean.push(toBeanText(beanField[key], packageName));
  }
  return bean.join("\n\n");
}

if (typeof module != "undefined") {
  module.exports = jsonToJavaBean;
}
