---
title: "热词管理 API v1.0--豆包语音-火山引擎"
source: "https://www.volcengine.com/docs/6561/1742791?lang=zh"
scraped_at: "2025-07-10"
---

# 更新日志 ChangeLog:


## v1.0


- 加入了多个热词管理模块的POST请求 | Added multiple new POST requests as part of the "Boosting Table API"


# 热词管理API | Hotword API (ALL For Application)

> - 访问鉴权
> 鉴权方式说明 https://www.volcengine.com/docs/6369/67268
> 线上请求地址域名 open.volcengineapi.com
> - 固定公共参数

>
```Python
Python
```


Region "cn-north-1"
Service "speech_saas_prod"
Version "2022-08-30"


```
>       3. AKSK获取 https://console.volcengine.com/iam/keymanage/
>       4. 结合文档内api说明调用`ListApplications` `ListBoostingTable` 的例子(*其他语言和使用sdk调用的方式请参考火山鉴权源码[说明](https://www.volcengine.com/docs/6369/185600) 一)

> ```Python
import binascii
import datetime
import hashlib
import hmac
import json
import requests
import urllib

domain = "open.volcengineapi.com"
region = "cn-north-1"
service = "speech_saas_prod"
contentType = "application/json; charset=utf-8"

def list_application(account_id: str, ak: str, sk: str) -> requests.Response:
    params = {
        "Action": "ListApplications",
        "Version": "2021-11-22",
        "X-Account-Id": account_id,
    }
    canonicalQueryString = get_canonical_query_string(params)
    print(canonicalQueryString)
    url = "https://" + domain + "/?" + canonicalQueryString
    payloadSign = get_hmac_encode16("")
    headers = get_hashmac_headers(
        domain,
        region,
        service,
        canonicalQueryString,
        "GET",
        "/",
        contentType,
        payloadSign,
        ak,
        sk,
    )

    submit_resp = requests.get(url=url, headers=headers)
    return submit_resp

def list_hotword_table(
    app_id: int,
    ak: str,
    sk: str,
) -> requests.Response:
    params_body = {
        "Action": "ListBoostingTable",
        "Version": "2022-08-30",
        "AppID": app_id,
        "PageNumber": 1,
        "PageSize": 10,
        "PreviewSize": 10,
    }
    canonical_query_string = "Action=ListBoostingTable&Version=2022-08-30"
    url = "https://" + domain + "/?" + canonical_query_string
    content_type = "application/json; charset=utf-8"
    payload_sign = get_hmac_encode16(json.dumps(params_body))
    headers = get_hashmac_headers(
        domain,
        region,
        service,
        canonical_query_string,
        "POST",
        "/",
        content_type,
        payload_sign,
        ak,
        sk,
    )

    submit_resp = requests.post(url=url, headers=headers, data=json.dumps(params_body))
    return submit_resp

def get_canonical_query_string(param_dict):
    target = sorted(param_dict.items(), key=lambda x: x[0], reverse=False)
    canonicalQueryString = urllib.parse.urlencode(target)
    return canonicalQueryString

def get_hmac_encode16(data):
    return binascii.b2a_hex(hashlib.sha256(data.encode("utf-8")).digest()).decode(
        "ascii"
    )

def get_volc_signature(secret_key, data):
    return hmac.new(secret_key, data.encode("utf-8"), digestmod=hashlib.sha256).digest()

def get_hashmac_headers(
    domain,
    region,
    service,
    canonicalquerystring,
    httprequestmethod,
    canonicaluri,
    contenttype,
    payloadsign,
    ak,
    sk,
):
    utc_time_sencond = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    utc_time_day = datetime.datetime.utcnow().strftime("%Y%m%d")
    credentialScope = utc_time_day + "/" + region + "/" + service + "/request"
    headers = {
        "content-type": contenttype,
        "x-date": utc_time_sencond,
    }
    canonicalHeaders = (
        "content-type:"
        + contenttype
        + "\n"
        + "host:"
        + domain
        + "\n"
        + "x-content-sha256:"
        + "\n"
        + "x-date:{}".format(utc_time_sencond)
        + "\n"
    )
    signedHeaders = "content-type;host;x-content-sha256;x-date"
    canonicalRequest = (
        httprequestmethod
        + "\n"
        + canonicaluri
        + "\n"
        + canonicalquerystring
        + "\n"
        + canonicalHeaders
        + "\n"
        + signedHeaders
        + "\n"
        + payloadsign
    )
    stringToSign = (
        "HMAC-SHA256"
        + "\n"
        + utc_time_sencond
        + "\n"
        + credentialScope
        + "\n"
        + get_hmac_encode16(canonicalRequest)
    )
    signingkey = get_volc_signature(
        get_volc_signature(
            get_volc_signature(
                get_volc_signature(sk.encode("utf-8"), utc_time_day), region
            ),
            service,
        ),
        "request",
    )
    signature = binascii.b2a_hex(get_volc_signature(signingkey, stringToSign)).decode(
        "ascii"
    )
    headers[
        "Authorization"
    ] = "HMAC-SHA256 Credential={}/{}, SignedHeaders={}, Signature={}".format(
        ak, credentialScope, signedHeaders, signature
    )
    return headers

if __name__ == "__main__":
    print(
        json.dumps(
            list_hotword_table(
                app_id=0,
                ak="",
                sk="",
            ).text
        )
    )
    print(
        json.dumps(
            list_application(
                account_id="",
                ak="",
                sk="",
            ).text
        )
    )
```


> - 错误码

> HTTP **status code not starting with 2xx** is considered an **error**;**Detailed Info** is listed inside the HTTP response body as
>
>
```
{
    "ResponseMetadata": {
        ...
        "Error": {
            "Code": "xxx",
            "Message": "xxx"
        }
    }
}
```

>
> **"ResponseMetadata.Error.Code"** **CAN** be safely used by client to check error type if any


## List User's Applications


### Views


### Request

**Method: GET**

| **Parameter** | **Type** | **Must** | **Argument type** | **Description** |
| --- | --- | --- | --- | --- |
| Action | string | Y | query | ListApplications |
| Version | string | Y | query | 2021-11-22 |


### Response


```JSON
{
  "status": "success",
  "error": null,
  "data": {
    "applications": [
      {
        "id": 86,
        "appid": "10004829",
        "top_account_id": "2100000839",
        "name": "test_lmy123123",
        "description": "Test_lmy111",
        "service_tree_node": "113953",
        "service_tree_path": "|AI-Lab|Speech|PLATFORM|SaaS",
        "created_timestamp": 1631093359000,
        "system": "volcengine",
        "state": "accepted",
        "deactivated": false,
        "alert_user_emails": null,
        "accepted": true,
        "state_comment": "",
        "user_permissions": [
          "admin"
        ],
        "modification": {},
        "workflow_id": ""
      },
      {
        "id": 88,
        "appid": "10004830",
        "top_account_id": "2100000839",
        "name": "test_lmy123123123",
        "description": "1",
        "service_tree_node": "113953",
        "service_tree_path": "|AI-Lab|Speech|PLATFORM|SaaS",
        "created_timestamp": 1631095608000,
        "system": "volcengine",
        "state": "accepted",
        "deactivated": false,
        "alert_user_emails": null,
        "accepted": true,
        "state_comment": "",
        "user_permissions": [
          "admin"
        ],
        "modification": {},
        "workflow_id": ""
      },
      {
        "id": 89,
        "appid": "10004831",
        "top_account_id": "2100000839",
        "name": "test1111",
        "description": "1",
        "service_tree_node": "113953",
        "service_tree_path": "|AI-Lab|Speech|PLATFORM|SaaS",
        "created_timestamp": 1631096047000,
        "system": "volcengine",
        "state": "accepted",
        "deactivated": false,
        "alert_user_emails": null,
        "accepted": true,
        "state_comment": "",
        "user_permissions": [
          "admin"
        ],
        "modification": {},
        "workflow_id": ""
      }
    ]
  }
}
JSON
```


## List Boosting Table Limits


### Views


- For listing limits of boosting table itself and total count


### Request

**Method: POST**

| **Parameter** | **Type** | **Must** | **Argument type** | **Description** |
| --- | --- | --- | --- | --- |
| Content-Type | string | Y | header | application/json; charset=utf-8 |
| Action | string | Y | body | ListBoostingTableLimits |
| Version | string | Y | body | 2022-08-30 |
| AppID | int | Y | body | AppID of application |


### Response


```JSON
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "ListBoostingTableLimits",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}" //header中的X-Top-Region参数
    },
    "Result":{
            "AppID": "xxx",
            "SingleTableSizeLimit": 1000, // 单个词表词数量限制
            "SingleWordSizeLimit": 10, // 单个单词限制
            "SingleWordSizeLimitBytes": 30,
            "SingleWordSizeLimitCN": 10,
            "TotalSizeLimit": 5000, // 单个用户所有词表总和词数量限制
            "TotalSizeLimitBytes": 5000,
            "TotalSizeLimitCN": 1666,
            "TotalTableCountLimit": 10, // 词表数量限制
            "CurTotalTableCount": 0, // 当前用户词表数量
            "CurTotalSize": 0, // 当前用户所有词表单词总量
            "CurTotalSizeBytes": 0,
            "CurTotalSizeCN": 0
    }
}
JSON
```


## Create Boosting Table (file size !createboostingtable.py未知大小!


## Check Boosting Table Name


### Description

判断同一appid下词表名是否重复 | Check if the given table name already exists for the same appid

### Views


### Request

**Method: POST**

| **Parameter** | **Type** | **Must** | **Argument type** | **Description** |
| --- | --- | --- | --- | --- |
| Content-Type | string | Y | header | application/json; charset=utf-8 |
| Action | string | Y | body | CheckBoostingTableName |
| Version | string | Y | body | 2022-08-30 |
| AppID | int | Y | body | AppID of application |
| BoostingTableName | string | Y | body | Name of the table |


### Response


```JSON
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "CheckBoostingTableName",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}" //header中的X-Top-Region参数
    },
    "Result":{
        "Message": "success" // 2xx status code is a success; message not important
    }
    true
}
JSON
```


```JSON
// 200 OK
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "CheckBoostingTableName",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}", //header中的X-Top-Region参数
        "Error": {
            "Code": "InvalidParameter.BoostingNameDuplicated",
            "Message": "The specified parameter BoostingTableName is invalid"
        }
    },
        "Result":false
}
JSON
```


## Update Boosting Table (


### Request

**Method: POST**

| **Parameter** | **Type** | **Must** | **Argument type** | **Description** |
| --- | --- | --- | --- | --- |
| Content-Type | string | Y | header | multipart/form-data; charset=utf-8 |
| Action | string | Y | body | UpdateBoostingTable |
| Version | string | Y | body | 2022-08-30 |
| AppID | int | Y | body | AppID of application |
| BoostingTableID | string | Y | body | ID of boosting table |
| BoostingTableName | string | N | body | Name of the table, update if not empty |
| File | string | Y | body | Contents of the TXT file; no larger than 8MB; |


### Response


```JSON
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "UpdateBoostingTable",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}" //header中的X-Top-Region参数
    },
    "Result":{
        "AppID": "xxx",
        "BoostingTableID" : "xxx",
        "BoostingTableName" : "xxx",
        "CreateTime": "2022-08-11T14:41:01Z", // UTC YYYY-MM-DD'T'HH:MM:SS'Z'
        "UpdateTime": "2022-08-11T14:41:01Z", // UTC YYYY-MM-DD'T'HH:MM:SS'Z'
        "WordSize": 1998,         // the total_word size
        "WordCount": 999       // the line of word
    }
}
JSON
```


> Update Boosting Table has **ALL** possible error codes and messages that**Create Boosting Table** and **Delete Boosting Table** have


## Delete Boosting Table


### Views


### Request

**Method: POST**

| **Parameter** | **Type** | **Must** | **Argument type** | **Description** |
| --- | --- | --- | --- | --- |
| Content-Type | string | Y | header | application/json; charset=utf-8 |
| Action | string | Y | body | DeleteBoostingTable |
| Version | string | Y | body | 2022-08-30 |
| AppID | int | Y | body | AppID of application |
| BoostingTableID | string | Y | body | ID of boosting table |


### Response


```JSON
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "DeleteBoostingTable",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}" //header中的X-Top-Region参数
    },
    "Result":{
        "Message": "success" // 2xx status code is a success; message not important
    }
}
JSON
```


```JSON
// 404 NotFound
// BoostingTableNotFound
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "UpdateBoostingTable",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}", //header中的X-Top-Region参数
        "Error": {
            "Code": "OperationDenied.BoostingTableNotFound",
            "Message": "Operation is denied because boosting table not found: xxx"
        }
    }
}
JSON
```


## List Boosting Table


### Views


### Request

**Method: POST**

| **Parameter** | **Type** | **Must** | **Argument type** | **Description** |
| --- | --- | --- | --- | --- |
| Content-Type | string | Y | header | application/json; charset=utf-8 |
| Action | string | Y | body | ListBoostingTable |
| Version | string | Y | body | 2022-08-30 |
| AppID | int | Y | body | AppID of application |
| PageNumber | int |  | body | Page number; default to 1; invalid value returns empty result |
| PageSize | int |  | body | Page size, default to 10; invalid value returns empty result |
| PreviewSize | int |  | body | Number of boosting words to preview, default to 10 |


### Response


```JSON
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "ListBoostingTable",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}" //header中的X-Top-Region参数
    },
    "Result":{
        "AppID": "xxx",
        "BoostingTableCount": 1,
        "BoostingTables": [
            {
                "AppID": "xxx",
                "BoostingTableID" : "xxx",
                "BoostingTableName" : "xxx",
                "CreateTime": "2022-08-11T14:41:01Z", // UTC YYYY-MM-DD'T'HH:MM:SS'Z'
                "UpdateTime": "2022-08-11T14:41:01Z", // UTC YYYY-MM-DD'T'HH:MM:SS'Z'
                "WordSize": 1998,         // the total_word size
                "WordCount": 999,       // the line of word
                "Preview": ["word1", "word2", "word3"] // preview words
            }
        ]
    }
}
JSON
```


## Get Boosting Table


### Views


### Request

**Method: POST**

| **Parameter** | **Type** | **Must** | **Argument type** | **Description** |
| --- | --- | --- | --- | --- |
| Content-Type | string | Y | header | application/json; charset=utf-8 |
| Action | string | Y | body | GetBoostingTable |
| Version | string | Y | body | 2022-08-30 |
| AppID | int | Y | body | AppID of application |
| BoostingTableID | string | Y | body | ID of boosting table |


### Response


```JSON
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "GetBoostingTable",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}" //header中的X-Top-Region参数
    },
    "Result":{
        "AppID": "xxx",
        "BoostingTableID" : "xxx",
        "BoostingTableName" : "xxx",
        "CreateTime": "2022-08-11T14:41:01Z", // UTC YYYY-MM-DD'T'HH:MM:SS'Z'
        "UpdateTime": "2022-08-11T14:41:01Z", // UTC YYYY-MM-DD'T'HH:MM:SS'Z'
        "WordSize": 1998,         // the total_word size
        "WordCount": 999,       // the line of word
        "File": "word\nword2\r\n", // the original file as string: client needs to parse it
        "Preview": ["all", "the", "words"]
    }
}
JSON
```


```JSON
// 404 NotFound
// BoostingTableNotFound
{
    "ResponseMetadata": {
        "RequestId": "20220214145719010211209131054BC103", //header中的X-Top-Request-Id参数
        "Action": "UpdateBoostingTable",
        "Version": "2022-08-30",
        "Service": "{Service}",//header中的X-Top-Service参数
        "Region": "{Region}", //header中的X-Top-Region参数
        "Error": {
            "Code": "OperationDenied.BoostingTableNotFound",
            "Message": "Operation is denied because boosting table not found: xxx"
        }
    }
}
JSON
```