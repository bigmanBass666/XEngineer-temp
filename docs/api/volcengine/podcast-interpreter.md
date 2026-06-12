# 火山引擎语音播客与同声传译文档

> 本文档包含语音播客模型和同声传译模型的产品简介与API接入文档。

---

## 一、语音播客大模型

**来源：** https://www.volcengine.com/docs/6561/1631587

### 产品简介

## **模型能力介绍**

豆包语音播客模型，专为文本转语音播客场景设计。基于最先进的大模型技术，能够实现文本到双人对话形式的音频内容的展现，为播客bot提供内容供给，对比真人播客具备成本低、速度快、时效性高、个性化等特征。


## **产品核心优势**


* **自然度跃升：** 融入真人播客的自然附和、口语停顿、「嗯」声及呼吸感等细节，对话质感媲美专业录制水准；

* **创作效率革新：** 端到端自动化流程，无需人工录制，极速生成双人 AI 对话播客；


### 优势对比


|**传统AI播客痛点** |**豆包语音播客模型优势** |
|---|---|
|* 内容冗余：重复、口语化不足；

* 听感机械：语音生硬、缺乏互动节奏；

* 体验单一：无法模拟真人对话的自然交互细节。 |基于豆包端到端实时语音模型（S2S），通过文本与语音多模态预训练，实现 “大脑（LLM）” 与 “嘴巴（TTS）” 深度协同：


* **拟真对话体验：** 超越传统 AI 播客的机械感，贴近真实人际交流；还原插话、附和、停顿等真人对话节奏，支持深度搜索能力，内容专业度与播客质感媲美人工录制；

* **效率与成本优势：** 对比真人播客，具备低成本、高时效、个性化生成特点，快速响应热点与定制需求。

* **场景适配性：** 兼顾信息密度与听觉体验，完美适配移动场景下的深度内容消费。 |


## **应用场景**


* **播客app/创作平台：** 以播客为主打，特色的app或saas平台

* **AI搜索：** 针对AI搜索app/网页、云盘类客户，将用户主动搜索的内容进行凝练总结，生成语音播报

* **内容生产分发：** 音视频剪辑或音频生产创作平台或工具，可上传文档、网页，制作音频视频内容的观点、信息解读

* **新闻资讯播报：** 新闻资讯网页、app内容进行总结及双人播报

* **儿童陪伴教育：** 儿童陪伴教育app，制作双人教学、科普讲解、故事等有声内容

### 播客API-websocket-v3协议

# 1 接口功能

火山控制台开启试用：https://console.volcengine.com/speech/service/10028

对提供的长文本或网页链接进行分析总结，也可以对一个特定话题做联网总结，最终流式生成双人播客音频。

支持断点重试。

功能更新：


|日期 |功能更新介绍 |
|---|---|
|2026 年 3 月 20 日 |1. 播客专属音色之外，支持 TTS 和 ICL复刻音色（复刻音色购买的 APPID 要和开通播客是同一个才能通过鉴权），支持 1.0 和 2.0 版本音色。（除了 mix 音色，多情感音色）

2. PodcastRoundEnd 事件加入本轮播客在完整播客的开始时间和结束时间。 |
|2026 年 5 月 12 日 |1. 新增参数 strict_audit，用于声明安全审核等级，true代表严格审核、false代表普通审核，默认为false。会对action = 0 的 inpu_text 和 action = 4 的 prompt_text 生效。 |


# 2 接口说明


## 2.1 请求Request


### 请求路径

`wss://openspeech.bytedance.com/api/v3/sami/podcasttts`


### 建连&鉴权


#### Request Headers


|Key |说明 |是否必须 |Value示例 |
|---|---|---|---|
|X\-Api\-App\-Id |使用火山引擎控制台获取的APP ID，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F) |是 |your\-app\-id |
|X\-Api\-Access\-Key |使用火山引擎控制台获取的Access Token，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F) |是 |your\-access\-key |
|X\-Api\-Resource\-Id |表示调用服务的资源信息 ID


* 播客语音合成：volc.service_type.10050 |是 |* 播客语音合成：volc.service_type.10050 |
|X\-Api\-App\-Key |固定值 |是 |aGjiRDfUWi |
|X\-Api\-Request\-Id |标识客户端请求ID，uuid随机字符串 |否 |67ee89ba\-7050\-4c04\-a3d7\-ac61a63499b3 |


#### Response Headers


|Key |说明 |Value示例 |
|---|---|---|
|X\-Tt\-Logid |服务端返回的 logid，建议用户获取和打印方便定位问题 |2025041513355271DF5CF1A0AE0508E78C |


### WebSocket 二进制协议

WebSocket 使用二进制协议传输数据。

协议的组成由至少 4 个字节的可变 header、payload size 和 payload 三部分组成，其中


* header 描述消息类型、序列化方式以及压缩格式等信息；

* payload size 是 payload 的长度；

* payload 是具体负载内容，依据消息类型不同 payload 内容不同；


需注意：协议中整数类型的字段都使用**大端**表示。


##### 二进制帧


|Byte |Left 4\-bit |Right 4\-bit |说明 |
|---|---|---|---|
|0 \- Left half |Protocol version | |目前只有v1，始终填0b0001 |
|0 \- Right half | |Header size (4x) |目前只有4字节，始终填0b0001 |
|1 \- Left half |Message type | |固定为0b001 |
|1 \- Right half | |Message type specific flags |在sendText时，为0

在finishConnection时，为0b100 |
|2 \- Left half |Serialization method | |0b0000：Raw（无特殊序列化方式，主要针对二进制音频数据）0b0001：JSON（主要针对文本类型消息） |
|2 \- Right half | |Compression method |0b0000：无压缩0b0001：gzip |
|3 |Reserved ||留空（0b0000 0000） |
|[4 ~ 7] |[Optional field,like event number,...] ||取决于Message type specific flags，可能有、也可能没有 |
|... |Payload ||可能是音频数据、文本数据、音频文本混合数据 |


###### payload请求参数


|**字段** |**描述** |**是否必须** |**类型** |**默认值** |
|---|---|---|---|---|
|action |生成类型：


* 0：根据提供的 input_text 或者 input_info.input_url 总结生成播客

* 3：根据提供的 nlp_texts 对话文本直接生成播客

* 4：根据提供的 prompt_text 文本联网生成播客 |是 |number |0 |
|input_text |待播客合成输入文本，上下文最长 32k，超过会报错

> action = 0 时候和 input_info.input_url 二选一，都不为空优先生效 input_text |否 |string |—— |
|prompt_text |prompt文本，不具备指令能力

> action = 4 时必填

> 一般比较简单，比如 “火山引擎” ，“怎么平衡工作和生活？” |否 |string |—— |
|nlp_texts |待合成的播客轮次文本列表

> action = 3 时必填 |否 |[]object |—— |
|nlp_texts.text |每个轮次播客文本

> 单轮不超过 300 字符

> 总文本长度不超过 10000 字符 |否 |string |—— |
|nlp_texts.speaker |每个轮次播客发音人

> 详细参见：可选发音人列表 |否 |string |—— |
|input_info |输入辅助信息 |否 |object |—— |
|input_info.input_url |网页链接或者可下载的文件(pdf,doc,txt)链接,会自动转换成长文播客文本 |否 |string |—— |
|input_info.only_nlp_text |只输出播客轮次文本列表，没有音频 |否 |bool |—— |
|input_info.return_audio_url |返回可下载的完整播客音频链接，有效期 1h

> 新增一个事件 363 （PodcastEnd），里面会有 meta_info.audio_url 字段 |否 |bool |—— |
|input_info.input_text_max_length |action=0 模式下面的模型处理最大字符数，超过会截断文本，建议设置不超过 12000 可以保证模型处理的稳定性

> 事件 363 （PodcastEnd），里面会有input_metrics表示截断信息 |否 |int |—— |
|input_info.max_char_length_per_round |支持每轮最大合成字符数（不是硬截断）。优先考虑语句完整性（带着句号），后判断是否超过最大字符数。 |否 |int |—— |
|input_info.strict_audit |用于声明安全审核等级，true代表严格审核、false代表普通审核，默认为false |否 |bool |false |
|use_head_music |是否使用开头音效 |否 |bool |true |
|use_tail_music |是否使用结尾音效 |否 |bool |false |
|aigc_watermark |是否在合成结尾增加音频节奏标识，作为显示水印 |否 |bool |false |
|aigc_metadata |在合成音频 header加入元数据隐式水印，支持 mp3/wav/ogg_opus |否 |object |—— |
|aigc_metadata.enable |是否启用隐式水印 |否 |bool |false |
|aigc_metadata.content_producer |合成服务提供者的名称或编码 |否 |string |"" |
|aigc_metadata.produce_id |内容制作编号 |否 |string |"" |
|aigc_metadata.content_propagator |内容传播服务提供者的名称或编码 |否 |string |"" |
|aigc_metadata.propagate_id |内容传播编号 |否 |string |"" |
|audio_config |音频参数，便于服务节省音频解码耗时 |否 |object |—— |
|audio_config.format |音频编码格式，mp3/ogg_opus/pcm/aac |否 |string |pcm |
|audio_config.sample_rate |音频采样率，可选值 [16000, 24000, 48000] |否 |number |24000 |
|audio_config.speech_rate |语速，取值范围[\-50,100]，100代表2.0倍速，\-50代表0.5倍数 |否 |number |0 |
|speaker_info |指定发音人信息 |否 |object |—— |
|speaker_info.random_order |发音人是否随机顺序开始，默认是 |否 |bool |true |
|speaker_info.speakers |播客发音人, 只能选择 2 发音人

> 详细参见：可选发音人列表 |否 |[]string | |
|speaker_info.speaker_additions |发音人额外信息，使用 TTS 和 ICL 音色的时候可生效：

key: speaker_id

value: 参考tts 合成文档（[https://www.volcengine.com/docs/6561/1719100?lang=zh](https://www.volcengine.com/docs/6561/1719100?lang=zh)）里面的 【req_params.additions】 参数，是个jsonstring

在使用复刻 2.0 音色的使用如果要切换模型也需要输入到下面的additions参数里面。model 参数的取值参考上述文档里面【req_params.model】的介绍。

参考：{"SPEAKERID1": additions, "SPEAKERID2": additions}

Golang:

additions = fmt.Sprintf("{"model": "seed\-tts\-2.0\-standard"}")

Python:

additions = json.dumps({"model": "seed\-tts\-2.0\-standard"}) |否 |map[string][string] |—— |
|retry_info |重试信息 |否 |object |—— |
|retry_info.retry_task_id |前一个没获取完整的播客记录的 task_id(第一次StartSession使用的 session_id就是任务的 task_id) |否 |string |—— |
|retry_info.last_finished_round_id |前一个获取完整的播客记录的轮次 id |否 |number |—— |


**可选发音人列表**

> 发音人的选择最好用同个系列的配对使用会有更好的效果

> 默认：dayi/mizai 系列


|**系列** |**发音人名称** |
|---|---|
|黑猫侦探社咪仔 |zh_female_mizaitongxue_v2_saturn_bigtts |
||zh_male_dayixiansheng_v2_saturn_bigtts |
|刘飞和潇磊 |zh_male_liufei_v2_saturn_bigtts |
||zh_male_xiaolei_v2_saturn_bigtts |
|TTS 音色列表 |https://www.volcengine.com/docs/6561/1257544?lang=zh |


**参数使用示例**

action = 0 长文本总结模式示例

```JSON
{
 "input_id": "test_podcast",
 "input_text": "分析下当前的大模型发展",
 "action": 0,
 "use_head_music": false,
 "audio_config": {
 "format": "mp3",
 "sample_rate": 24000,
 "speech_rate": 0,
 },
 "speaker_info": {
 "random_order": true,
 "speakers": [
 "zh_male_dayixiansheng_v2_saturn_bigtts",
 "zh_female_mizaitongxue_v2_saturn_bigtts"
 ]
 },
 "aigc_watermark": false,
 "aigc_metadata": {
 "enable": true,
 "content_producer": "volcengine",
 "produce_id": "12abc",
 "content_propagator": "volcengine",
 "propagate_id": "34def"
 }
}
```


action = 0 url 解析模式示例

```JSON
{
 "input_id": "test_podcast",
 "action": 0,
 "use_head_music": false,
 "audio_config": {
 "format": "mp3",
 "sample_rate": 24000,
 "speech_rate": 0,
 },
 "input_info": {
 "input_url": "https://mp.weixin.qq.com/s/CiN0XRWQc3hIV9lLLS0rGA"
 }
}
```


action = 3 根据提供的对话文本调用示例

```JSON
{
 "input_id": "test_podcast",
 "action": 3,
 "use_head_music": false,
 "audio_config": {
 "format": "mp3",
 "sample_rate": 24000,
 "speech_rate": 0,
 },
 "nlp_texts": [
 {
 "speaker": "zh_male_dayixiansheng_v2_saturn_bigtts",
 "text": "今天呢我们要聊的呢是火山引擎在这个 FORCE 原动力大会上面的一些比较重磅的发布。"
 },
 {
 "speaker": "zh_female_mizaitongxue_v2_saturn_bigtts",
 "text": "来看看都有哪些亮点哈。"
 }
 ]
}
```


action = 4 根据提供prompt文本联网总结调用示例

```JSON
{
 "input_id": "test_podcast",
 "action": 4,
 "prompt_text": "火山引擎",
 "use_head_music": false,
 "audio_config": {
 "format": "mp3",
 "sample_rate": 24000,
 "speech_rate": 0,
 }
}
```


## 2.2 响应Response


### 建连响应

主要关注建连阶段 HTTP Response 的状态码和 Body


* 建连成功：状态码为 200

* 建连失败：状态码不为 200，Body 中提供错误原因说明


### WebSocket 传输响应


#### 二进制帧 \- 正常响应帧


|Byte |Left 4\-bit |Right 4\-bit |说明 |
|---|---|---|---|
|0 \- Left half |Protocol version | |目前只有v1，始终填0b0001 |
|0 \- Right half | |Header size (4x) |目前只有4字节，始终填0b0001 |
|1 \- Left half |Message type | |音频帧返回：0b1011

其他帧返回：0b1001 |
|1 \- Right half | |Message type specific flags |固定为0b0100 |
|2 \- Left half |Serialization method | |0b0000：Raw（无特殊序列化方式，主要针对二进制音频数据）0b0001：JSON（主要针对文本类型消息） |
|2 \- Right half | |Compression method |0b0000：无压缩0b0001：gzip |
|3 |Reserved ||留空（0b0000 0000） |
|[4 ~ 7] |[Optional field,like event number,...] ||取决于Message type specific flags，可能有、也可能没有 |
|... |Payload ||可能是音频数据、文本数据、音频文本混合数据 |


##### payload响应参数


|字段 |描述 |类型 |
|---|---|---|
|data |返回的二进制数据包 |byte |
|event |返回的事件类型 |number |


#### 二进制帧 \- 错误响应帧


|Byte |Left 4\-bit |Right 4\-bit |说明 |
|---|---|---|---|
|0 \- Left half |Protocol version | |目前只有v1，始终填0b0001 |
|0 \- Right half | |Header size (4x) |目前只有4字节，始终填0b0001 |
|1 |Message type |Message type specific flags |0b11110000 |
|2 \- Left half |Serialization method | |0b0000：Raw（无特殊序列化方式，主要针对二进制音频数据）0b0001：JSON（主要针对文本类型消息） |
|2 \- Right half | |Compression method |0b0000：无压缩0b0001：gzip |
|3 |Reserved ||留空（0b0000 0000） |
|[4 ~ 7] |Error code ||错误码 |
|... |Payload ||错误消息对象 |


## 2.3 event定义

在生成 podcast 阶段，不需要客户端发送上行的event帧。event类型如下：


|Event code |含义 |事件类型 |应用阶段：上行/下行 |
|---|---|---|---|
|150 |SessionStarted，会话任务开始 |Session 类 |下行 |
|360 |PodcastRoundStart，播客返回新轮次内容开始，带着轮次 idx 和 speaker |数据类 |下行 |
|361 |PodcastRoundResponse，播客返回轮次的音频内容 |数据类 |下行 |
|362 |PodcastRoundEnd，播客返回内容当前轮次结束

示例：

{

"audio_duration":8.419333, // 单位秒，时长

"end_time":38.216, // 单位秒，开始时间

"start_time":25.25 // 单位秒，结束时间

} |数据类 |下行 |
|363 |PodcastEnd，返回一些播客总结性的信息，表示播客结束（为了兼容之前的使用，这个事件不一定会返回）

示例：{'meta_info': {'audio_url': 'https://speech\-tts\-podcast.tos\-cn\-beijing.volces.com/speech\-tts\-podcast/tts_audio/aGjiRDfUWi/b598a76a\-ebb2\-4117\-9270\-9b3b740e1adb/podcast_demo.mp3?X\-Tos\-Algorithm=TOS4\-HMAC\-SHA256&X\-Tos\-Credential=AKLTY2M5ZDg4NzA2MDUxNDI0ZThkMTU5YTNkNjk4ZDg5OTM%2F20250825%2Fcn\-beijing%2Ftos%2Frequest&X\-Tos\-Date=20250825T070712Z&X\-Tos\-Expires=3600&X\-Tos\-Signature=55a5e2d0bd40f91fc846068f9d35737b96e9891134aabb783b973f91b5f993c9&X\-Tos\-SignedHeaders=host', 'topics': None, 'input_metrics': {'origin_input_text_length': 14, 'input_text_length': 10, 'input_text_truncated': True}}} |数据类 |下行 |
|152 |SessionFinished，会话已结束（上行&下行）

标识语音一个完整的语音合成完成 |Session 类 |下行 |
|154 |UsageResponse, 播客返回的用量事件。

示例:{"usage":{"input_text_tokens":980,"output_audio_tokens":0}} 其中input_text_tokens表示"API调用token\-输入\-文本", output_audio_tokens表示"API调用token\-输出\-音频" 。 |数据类 |下行 |


在关闭连接阶段，需要客户端传递上行event帧去关闭连接。event类型如下：


|Event code |含义 |事件类型 |应用阶段：上行/下行 |
|---|---|---|---|
|2 |FinishConnection，结束连接 |Connect 类 |上行 |
|52 |ConnectionFinished 结束连接成功 |Connect 类 |下行 |


**示意图（重要！！！！）** ：

![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/9b8ade61c5c94728b1b789769272eb1c~tplv-goo7wpa0wc-image.image) 


## 2.4 不同类型帧举例说明


### StartSession


#### 请求 request


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1001 |0100 |Full\-client request |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |StartSession ||event type ||
|8 ~ 11 |uint32(12) | |len() ||
|12 ~ 23 |nxckjoejnkegf | |session_id ||
|24 ~ 27 |uint32( ...) | |len(payload) ||
|28 ~ ... |{} ||`payload` 见下面的例子 ||


`payload`

```JSON
{
 "input_id": "test_podcast",
 "input_text": "分析下当前的大模型发展",
 "scene": "deep_research",
 "action": 0,
 "use_head_music": false,
 "audio_params": {
 "format": "pcm",
 "sample_rate": 24000,
 "speech_rate": 0,
 }
}
```


断点续传的时候需要加上 retry 信息

`payload`

```JSON
{
 "input_id": "test_podcast",
 "input_text": "分析下当前的大模型发展",
 "scene": "deep_research",
 "action": 0,
 "use_head_music": false,
 "audio_params": {
 "format": "pcm",
 "sample_rate": 24000,
 "speech_rate": 0,
 },
 "retry_info": {
 "retry_task_id": "xxxxxxxxx",
 "last_finished_round_id": 5
 }
}
```


#### 响应Response


##### SessionStarted


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1011 |0100 |Audio\-only response |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |SessionStarted ||event type | |
|8 ~ 11 |uint32(12) ||len() | |
|12 ~ 23 |nxckjoejnkegf ||session_id | |
|24 ~ 27 |uint32( ...) ||len(audio_binary) | |
|28 ~ ... |{

} ||payload_json

扩展保留，暂留空JSON | |


**UsageResponse**


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1011 |0100 |Audio\-only response |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |UsageResponse ||event type | |
|8 ~ 11 |uint32(12) ||len() | |
|12 ~ 23 |nxckjoejnkegf ||session_id | |
|24 ~ 27 |uint32( ...) ||len(audio_binary) | |
|28 ~ ... |文本 token 消耗推送：

{"usage":{"input_text_tokens":980,"output_audio_tokens":0}}

音频 token 消耗推送： ||payload_json

用量信息 | |


下面三个事件循环 ♻️,如果没有收到PodcastTTSRoundEnd（需要和PodcastSpeaker成对出现）就断掉了链接说明需要断点续传重新发起请求


##### PodcastRoundStart


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1011 |0100 |Audio\-only response |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |PodcastRoundStart ||event type | |
|8 ~ 11 |uint32(12) ||len() | |
|12 ~ 23 |nxckjoejnkegf ||session_id | |
|24 ~ 27 |uint32( ...) ||len(audio_binary) | |
|28 ~ ... |{

"text_type": "", // 文本类型

"speaker": "", // 本次说话speaker

"round_id": \-1, // 对话轮次，\-1 是开头音乐

"text": "" // 对话文本

} ||response_meta_json

round_id == \-1，代表开头音频

round_id ==9999，代表结尾音频 | |


##### PodcastRoundResponse


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1001 |0100 |Full\-client request |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |PodcastTTSResponse ||event type ||
|8 ~ 11 |uint32(12) | |len() ||
|12 ~ 23 |nxckjoejnkegf | |session_id ||
|24 ~ 27 |uint32( ...) | |len(payload) ||
|28 ~ ... |... 音频内容 ||payload ||


##### PodcastRoundEnd


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1001 |0100 |Full\-client request |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |PodcastRoundEnd ||event type | |
|8 ~ 11 |uint32(12) ||len() ||
|12 ~ 23 |nxckjoejnkegf ||session_id ||
|24 ~ 27 |uint32( ...) ||len(response_meta_json) ||
|28 ~ ... |{

"is_error": true,

"error_msg": "something error"

}

or

{

"audio_duration":8.419333, // 单位秒

"end_time":38.216, // 单位秒

"start_time":25.25 // 单位秒

}

每句播客返回带着时长以及在完整播客音频的开始和结束时间位置。 ||response_meta_json ||


##### PodcastEnd


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1001 |0100 |Full\-client request |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |PodcastEnd ||event type | |
|8 ~ 11 |uint32(12) ||len() ||
|12 ~ 23 |nxckjoejnkegf ||session_id ||
|24 ~ 27 |uint32( ...) ||len(response_meta_json) ||
|28 ~ ... |{'meta_info': {'audio_url': 'https://speech\-tts\-podcast.tos\-cn\-beijing.volces.com/speech\-tts\-podcast/tts_audio/aGjiRDfUWi/a0979493\-196a\-42ad\-aff1\-1dfe63c7e219/podcast_demo.mp3?X\-Tos\-Algorithm=TOS4\-HMAC\-SHA256&X\-Tos\-Credential=AKLTY2M5ZDg4NzA2MDUxNDI0ZThkMTU5YTNkNjk4ZDg5OTM%2F20250825%2Fcn\-beijing%2Ftos%2Frequest&X\-Tos\-Date=20250825T084035Z&X\-Tos\-Expires=3600&X\-Tos\-Signature=2a549ee5f5ed8a32ce34d475ccf56f50a02e78b3431eb760fb9edc3d0d15296b&X\-Tos\-SignedHeaders=host', 'topics': None}} ||response_meta_json

没有需要返回的 meta 信息这个事件不会推送 ||


### FinishSession


#### 请求request


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1001 |0100 |Full\-client request |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |FinishSession ||event type ||
|8 ~ 11 |uint32(12) | |len() ||
|12 ~ 23 |nxckjoejnkegf | |session_id ||
|24 ~ 27 |uint32( ...) | |len(payload) ||
|28 ~ ... |{} ||tts_session_meta ||


#### 响应response


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1001 |0100 |Full\-client request |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |SessionFinished ||event type ||
|8 ~ 11 |uint32(7) ||len() ||
|12 ~ 15 |uint32(58) ||len() ||
|28 ~ ... |{

"status_code": 20000000,

"message": "ok"

} ||response_meta_json


* 仅含status_code和message字段 ||


### FinishConnection


#### 请求request


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1001 |0100 |Full\-client request |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |FinishConnection ||event type ||
|8 ~ 11 |uint32(2) ||len() ||
|12 ~ 13 |{} ||tts_session_meta ||


#### 响应response


|Byte |Left 4\-bit |Right 4\-bit |说明 ||
|---|---|---|---|---|
|0 |0001 |0001 |v1 |4\-byte header |
|1 |1001 |0100 |Full\-client request |with event number |
|2 |0001 |0000 |JSON |no compression |
|3 |0000 |0000 | | |
|4 ~ 7 |ConnectionFinished ||event type ||
|8 ~ 11 |uint32(7) ||len() ||
|12 ~ 15 |uint32(58) ||len() ||
|28 ~ ... |{

"status_code": 20000000,

"message": "ok"

} ||response_meta_json


* 仅含status_code和message字段 ||


# 3 错误码


|Code |Message |说明 |
|---|---|---|
|20000000 |ok |音频合成结束的成功状态码 |
|45000000 |quota exceeded for types: concurrency |并发限流，一般是请求并发数超过限制 |
|40000010 |PodcastTTS invalid param |参数错误，根据 msg 信息检测入参是否正确 |
|40000022 |IllegalPayload:TextRiskAuditFailed |开启严格风控之后命中风控合成失败，建议检查输入文本 |
|55000000 |服务端一些error |服务端通用错误 |
|50302102 |action = 0 的报错：

NLP RespError(50000001/FangzhouPodcastNLPFailed:content filter)

action = 4 的报错：

NLP RespError(50000001/server error: GetOutlineFailed:Failed to generate the podcast. The cause of the error is: content filter)

或者

NLP RespError(50000001/server error: GetOutlineFailed:Failed to generate the podcast. The cause of the error is: get outline base model return empty) |触发安全审核过滤 |
|50302102 |NLP RespError(50000001/FangzhouPodcastNLPFailed:content length) |文本上下文超过限制 |


# 4 调用示例


Python调用示例


### 前提条件


* 调用之前，您需要获取以下信息：

 * ``：使用控制台获取的APP ID，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。

 * ``：使用控制台获取的Access Token，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。


### Python环境


* Python：3.9版本及以上。

* Pip：25.1.1版本及以上。您可以使用下面命令安装。


```Bash
python3 -m pip install --upgrade pip
```


### 下载代码示例

volcengine.speech.volc_speech_python_sdk_1.0.0.25.tar.gz


 

解压缩代码包，安装依赖

```Bash
mkdir -p volcengine_podcasts_demo
tar xvzf volcengine_podcasts_demo.tar.gz -C ./volcengine_podcasts_demo
cd volcengine_podcasts_demo
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
pip3 install -e .
```


### 发起调用

> ``替换为您的APP ID。

> ``替换为您的Access Token。

> `` 为播客文本。


```Bash
python3 examples/volcengine/podcasts.py --appid --access_token --text "介绍下火山引擎" 
```


Java调用示例


### 前提条件


* 调用之前，您需要获取以下信息：

 * ``：使用控制台获取的APP ID，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。

 * ``：使用控制台获取的Access Token，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。


### Java环境


* Java：21版本及以上。

* Maven：3.9.10版本及以上。


### 下载代码示例

volcengine.speech.volc_speech_java_sdk_1.0.0.19.tar.gz


 

解压缩代码包，安装依赖

```Bash
mkdir -p volcengine_podcasts_demo
tar xvzf volcengine_podcasts_demo.tar.gz -C ./volcengine_podcasts_demo
cd volcengine_podcasts_demo
```


### 发起调用

> ``替换为您的APP ID。

> ``替换为您的Access Token。

> `` 为播客文本。


```Bash
mvn compile exec:java -Dexec.mainClass=com.speech.volcengine.Podcasts -DappId= -DaccessToken= -Dtext="介绍下火山引擎"
```


Go调用示例


### 前提条件


* 调用之前，您需要获取以下信息：

 * ``：使用控制台获取的APP ID，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。

 * ``：使用控制台获取的Access Token，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。


### Go环境


* Go：1.21.0版本及以上。


### 下载代码示例

volcengine.speech.volc_speech_go_sdk_1.0.0.23.tar.gz


 

解压缩代码包，安装依赖

```Bash
mkdir -p volcengine_podcasts_demo
tar xvzf volcengine_podcasts_demo.tar.gz -C ./volcengine_podcasts_demo
cd volcengine_podcasts_demo
```


### 发起调用

> ``替换为您的APP ID。

> ``替换为您的Access Token。

> `` 为播客文本。


```Bash
go run volcengine/podcasts/main.go --appid --access_token --text "介绍下火山引擎"
```


C#调用示例


### 前提条件


* 调用之前，您需要获取以下信息：

 * ``：使用控制台获取的APP ID，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。

 * ``：使用控制台获取的Access Token，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。


### C#环境


* .Net 9.0版本。


### 下载代码示例

volcengine.speech.volc_speech_dotnet_sdk_1.0.0.13.tar.gz


 

解压缩代码包，安装依赖

```Bash
mkdir -p volcengine_podcasts_demo
tar xvzf volcengine_podcasts_demo.tar.gz -C ./volcengine_podcasts_demo
cd volcengine_podcasts_demo
```


### 发起调用

> ``替换为您的APP ID。

> ``替换为您的Access Token。

> `` 为播客文本。


```Bash
dotnet run --project Volcengine/Podcasts/Volcengine.Speech.Podcasts.csproj -- --appid --access_token --text "介绍下火山引擎"
```


TypeScript调用示例


### 前提条件


* 调用之前，您需要获取以下信息：

 * ``：使用控制台获取的APP ID，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。

 * ``：使用控制台获取的Access Token，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)。


### node环境


* node：v24.0版本及以上。


### 下载代码示例

volcengine.speech.volc_speech_js_sdk_1.0.0.19.tar.gz


 


### 解压缩代码包，安装依赖

```Bash
mkdir -p volcengine_podcasts_demo
tar xvzf volcengine_podcasts_demo.tar.gz -C ./volcengine_podcasts_demo
cd volcengine_podcasts_demo
npm install
npm install -g typescript
npm install -g ts-node
```


### 发起调用

> ``替换为您的APP ID。

> ``替换为您的Access Token。

> `` 为播客文本。


```Bash
npx ts-node src/volcengine/podcasts.ts --appid --access_token --text "介绍下火山引擎"
```


输出音频 demo：

podcast_final.mp3

---

## 二、语音同声传译大模型

**来源：** https://www.volcengine.com/docs/6561/1631604

### 产品简介

# **模型能力介绍**

**产品定位：超低时延语音端到端同声传译模型**

豆包同声传译模型，专为实时跨语言交流场景设计。基于端到端语音理解生成技术，依托集成化的模型架构，豆包同传大模型能够**无缝衔接完成从语音识别、语义理解到翻译的自然输出**，避免了传统级联模型中多模块运作时的延迟和误差叠加问题，极大地提升了整体效率和用户体验。即便是在讲话人频繁打断、语速不均等复杂实时对话场景中，也能迅速作出反应，精准翻译每一句话。支持中英互译，可实时处理多人语音输入，可以像人类同传译员一样以**极低的延迟 “边听边说”** ，同时，Seed LiveInterpret 2.0 还**支持零样本声音复刻**，让沟通更加流畅自然。

该模型支持2种模式：


* **语音到文本（S2T）：** 语音流式输入，对语音理解翻译后文本返回；

* **语音到语音（S2S）：** 语音流式输入，对语音理解翻译后，模型自动对说话人声音进行复刻，并按照说话人的音色进行目标语种语音的输出；


# **体验入口**

PC版本：[https://console.volcengine.com/ark/region:ark+cn-beijing/experience/voice?type=SI](https://console.volcengine.com/ark/region:ark+cn-beijing/experience/voice?type=SI)

H5版本：[https://www.volcengine.com/product/realtime-voice-model](https://www.volcengine.com/product/realtime-voice-model)

模型介绍及demo：[Seed 端到端同声传译大模型发布：准确率接近真人，3s 延迟，实时声音复刻](https://mp.weixin.qq.com/s/vjq_cwneALGoPf6RgxwuLQ)


# **产品核心优势**


* **高质量翻译，媲美真人：** 精准的语音理解能力保障了翻译准确度；在多人说话、中英混杂等复杂场景下，模型仍能实现高质量的传译。

* **实时翻译，超低延时：** 采用全双工语音理解生成框架，翻译延迟可低至 2\-3 秒，实现文本与语音的同步生成，真正做到“边听边说”的翻译。

* **零样本声音复刻，更自然：** 统一的语音理解生成框架让模型实现了精准还原说话者音色，无需提前录制，一边说话一边采样，即可合成“原声”语音翻译。

* **节奏流畅，更智能：** 可根据说话的清晰度，流畅度，复杂程度等调整输出节奏，智能平衡翻译质量、延迟以及语音节奏，做到真正的“同声传译”。


## 优势对比


|**传统机器同传痛点** |**豆包语音同传模型优势** |
|---|---|
|* 实时性差：延迟高、跟不上语速；

* 准确性低：复杂场景翻译能力差、语境理解偏差；

* 听感机械：语调单一，缺乏自然语气起伏。 |豆包同声传译模型，基于端到端模型架构，可实现高准确率、低时延的语音到文本&语音到语音的同传传译能力。


* **复杂场景下的精准理解：** 先进的语言理解和大模型技术，能在复杂的语境下捕捉到精确的语义，更高的有效字段占比，翻译质量接近高水平人类同传；

* **真正实现“边听边说”：** 智能决策断句，动态降低翻译延迟，无缝衔接提升沟通效率；

* **零样本实时声音复刻：** 无需提前采集声音样本，通过实时对话可实现“0样本”声音复刻，用复刻声音“说”出传译音频；

* **智能平衡实时性与准确性：** Seed LiveInterpret 2.0 能够自动寻找翻译质量和延迟之间超参数的最佳值，保证更高的翻译准确率。 |


# 应用场景


* **国际会议/商务会议：** 开启字幕翻译功能，避免了语言不通造成的沟通障碍，帮助参会各方高效合作

* **手机通话/助手：** 手机助手内置同声传译的功能，或者在实时通话中提供同声传译服务

* **智能硬件：** 耳机、眼镜、翻译机等硬件，接入语音同传服务，提供跨语言办公或旅游支持

* **在线教育：** app或学习机，提供实时字幕，跨越语言障碍，让用户离知识更进一步

### 同声传译2.0-API接入文档

# 简介

本文档介绍如何通过WebSocket协议实时访问同传大模型 (AST)服务，主要包含鉴权相关、协议详情、常见问题和使用Demo四部分。支持s2s（Speech\-to\-Speech），s2t（Speech\-to\-Text），目前支持支持克隆本身说话人的音色，支持的语种如下：


|**输入/输出模式** |**源语种/目标语种设置模式** |**支持语种** |**语种数量** |**备注** |
|---|---|---|---|---|
|**语音到语音（S2S）模式** |1. 需指定源语种、目标语种

2. 源语种或目标语种必须是zh中文/en英语 |zh中文、en英语、pt葡萄牙语、es西班牙语、ja日语、id印尼语、de德语、fr法语 |8 |如果目标语种为zh中文/en英语，可支持使用公版音色播报，可选2个音色：


* zh_female_vv_uranus_bigtts

* zh_male_jingqiangkanye_emo_mars_bigtts |
||自动识别免切换 |zh中文、en英语 |2 ||
|**语音到文本（S2T）模式** |1. 需指定源语种、目标语种

2. 源语种或目标语种必须是zh中文/en英语

3. 方言仅支持作为源语种 |**外语：** zh中文、en英语、pt葡萄牙语、es西班牙语、ja日语、id印尼语、de德语、fr法语、ru俄语、it意大利语、ko韩语、ar阿拉伯语、tr土耳其语、ms马来语、vi越南语、th泰语、nl荷兰语、ro罗马尼亚语、pl波兰语、cs捷克语

**方言：** 粤语、上海话 |20外语

2方言 ||


AST 服务使用的接口地址是：wss://openspeech.bytedance.com/api/v4/ast/v2/translate


# 非业务直接相关协议


## 鉴权

在 websocket 建连的 HTTP 请求头（Request Header 中）添加以下信息

使用[新版控制台](https://console.volcengine.com/speech/new)时，推荐采用以下更简化的鉴权方式。


|Key |说明 |参数类型 |是否必须 |Value示例 |
|---|---|---|---|---|
|X\-Api\-Key |使用火山引擎控制台获取的API Key，可参考 [控制台API Key管理](https://www.volcengine.com/docs/6561/2119699?lang=zh#ew1HctnP) |string |必须 |"your\-api\-key" |
|X\-Api\-Resource\-Id |表示调用服务的资源信息 ID，是固定值 |string |必须 |volc.service_type.10053 |


```Python
headers = {
 "X-Api-Key": "your-api-key",
 "X-Api-Resource-Id": "volc.service_type.10053"
}
```


若使用[旧版控制台](https://console.volcengine.com/speech/app)，鉴权方式如下。建议尽快切换至新版，以体验更便捷的鉴权流程。


|Key |说明 |参数类型 |是否必须 |Value示例 |
|---|---|---|---|---|
|X\-Api\-App\-Id |使用火山引擎控制台获取的App\-Id，可参考 [控制台API Id管理](https://www.volcengine.com/docs/6561/196768?lang=zh#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F) |string |必须 |“12345678” |
|X\-Api\-Access\-Key |使用火山引擎控制台获取的Access Token，可参考 [控制台使用FAQ-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F)（旧版控制台使用，新版控制台只需要X\-Api\-Key即可） |string |必须 |“your\-access\-key” |
|X\-Api\-Resource\-Id |表示调用服务的资源信息 ID，是固定值 |string |必须 |volc.service_type.10053 |


```Python
headers = {
 "X-Api-App-Id": "123456789",
 "X-Api-Access-Key": "your-access-key",
 "X-Api-Resource-Id": "volc.service_type.10053"
}
```


websocket 握手成功后，会返回 Response header


|Key |说明 |Value 示例 |
|---|---|---|
|X\-Tt\-Logid |服务端返回的 logid，建议用户获取和打印方便定位问题 |202407261553070FACFE6D19421815D605 |


## 建连 HTTP 请求头示例

```Plain
GET /api/v4/ast/v2/translate 
Host: openspeech.bytedance.com
X-Api-App-Key: 123456789
X-Api-Resource-Id: volc.service_type.10053

# 返回 Header
X-Tt-Logid: 202407261553070FACFE6D19421815D605
```


# 业务协议详情


## Protobuf

protos.tar.gz


 

**构建方法**：下载并解压上面的gzip压缩包后，参考其中的`HOWTO.md`教程

> 目前有Go，Python, Java语言的构建教程，此压缩包为Go的示例教程， Python, Java语言的构建教程直接打包在下方Client Demo中，请直接下载获取。


### Client Demo

Go：

ast_go_client.zip


 

Python：

ast_python_client.zip


 

Java:

ast_java_client.zip


 


## 交互流程

![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/d9b9280715014742a02bbc47003d1421~tplv-goo7wpa0wc-image.image) 


## WebSocket 二进制协议

WebSocket protobuf传输数据。


### Event 字段描述

发送端 Event Type:


|Event |取值 |描述 |
|---|---|---|
|StartSession |100 |建联请求 |
|UpdateConfig |201 |更新参数 |
|TaskRequest |200 |发送音频数据 |
|FinishSession |102 |结束session |


接收端 Event Type:


|Type |取值 |描述 |
|---|---|---|
|SessionStarted |150 |建联成功 |
|SourceSubtitleStart |650 |原文开始 |
|SourceSubtitleResponse |651 |原文数据 |
|SourceSubtitleEnd |652 |原文结束 |
|TranslationSubtitleStart |653 |译文开始 |
|TranslationSubtitleResponse |654 |译文数据 |
|TranslationSubtitleEnd |655 |译文结束 |
|TTSSentenceStart |350 |TTS开始 |
|TTSResponse |352 |TTS数据 |
|TTSSentenceEnd |351 |TTS结束 |
|UsageResponse |154 |计量计费 |
|SessionFinished |152 |会话正常结束 |
|SessionFailed |153 |会话失败 |
|AudioMuted |250 |静音事件 |


## 请求流程


### 发送端


#### 建立连接\-StartSession

根据 WebSocket 协议本身的机制，client 会发送 HTTP GET 请求和 server 建立连接做协议升级。

需要在其中根据身份认证协议加入鉴权签名头。设置方法请参考鉴权。

WebSocket 建立连接后，发送的第一个请求是 建联 request。请求体字段说明：


|字段名 |说明 |层级 |格式 |是否必填 |备注 |
|---|---|---|---|---|---|
|request_meta |请求元信息 |1 |dict |✓ |请求元信息 |
|session_id |会话ID |2 |string |✓ |建议采用UUID |
|event |请求事件说明 |1 |enum(int32) |✓ |建联请求的event 为100，见上文Event 字段描述 |
|user |用户相关配置 |1 |dict | |提供后可供服务端过滤日志 |
|uid |用户标识 |2 |string | |建议采用 IMEI 或 MAC。 |
|did |设备名称 |2 |string | | |
|platform |操作系统及API版本号 |2 |string | |iOS/Android/Linux |
|sdk_version |sdk版本 |2 |string | | |
|request |请求相关配置 |1 |dict |✓ |请求配置说明 |
|mode |模式 |2 |string | |s2t/s2s 选一个, 控制是否需要语音 |
|speaker_id |说话人音色 |2 |string | |选择传入以下精品音色作为输出音频的说话人，不传或者传错则使用默认行为（复刻输入音频音色）

`zh_female_vv_uranus_bigtts`

`zh_male_jingqiangkanye_emo_mars_bigtts` |
|speech_rate |语速 |2 |number | |取值范围[\-50,100],100代表2.0倍速,\-50代表0.5倍数 |
|source_language |源语言 |2 |string | |见下方：**语种说明** |
|target_language |目标语言 |2 |string | |见下方：**语种说明** |
|corpus |语料/干预词等 |2 |dict | |自定义词典，该object的所有配置字段（热词和术语）加和不超过1000个。超过则会报错。 |
|hot_words_list |热词列表 |3 |[string] | |原文字幕识别时使用的热词词库,用来指导模型，不一定干预生效（优先级高于传热词表）

示例：

```JSON```
```["视频直播","赛事直播","智能家居"]```
 |
|boosting_table_id |热词表ID |3 |string | |自学习平台上设置的热词词表ID

热词表功能和设置方法可以参考[文档](https://www.volcengine.com/docs/6561/155739) |
|boosting_table_name |热词表名 |3 |string | |自学习平台上设置的热词词表名称

热词表功能和设置方法可以参考[文档](https://www.volcengine.com/docs/6561/155739) |
|correct_words |替换词 |3 |json string | |原文和译文字幕识别时使用的替换词词库，（优先级高于传替换词表）

示例：

```JSON```
```"{\"接受\":\"接收\",\"Accept\":\"Receive\"}"```
 |
|regex_correct_table_id |替换词表ID |3 |string | |自学习平台上设置的替换词词表名称

替换词功能和设置方法可以参考[文档](https://www.volcengine.com/docs/6561/1206007) |
|regex_correct_table_name |替换词表名 |3 |string | |自学习平台上设置的替换词词表ID

替换词功能和设置方法可以参考[文档](https://www.volcengine.com/docs/6561/1206007) |
|glossary_list |术语列表 |3 |dict | |原文翻译成译文时使用的术语词词库，用来指导模型，不一定干预生效（优先级高于传术语词表）

示例:

```JSON```
```{"人工智能":"Machine Learning"}```
 |
|glossary_table_id |术语词表ID |3 |string | |自学习平台上设置的术语词词表ID |
|glossary_table_name |术语词表名 |3 |string | |自学习平台上设置的术语词词表名称 |
|source_audio |源音频相关配置 |1 |dict |✓ |源音频信息 |
|format |音频容器格式 |2 |string |✓ |wav，仅支持wav |
|codec |音频编码格式 |2 |string | |raw， raw(表示pcm编码) 。 仅支持raw |
|rate |音频采样率 |2 |int | |必须是16000 |
|bits |音频采样点位数 |2 |int | |必须是16 |
|channel |音频声道数 |2 |int | |1(mono) / 2(stereo)，当前仅支持单声道，必须传1 |
|target_audio |目标音频相关配置 |1 |dict |s2s时必填，s2t时非必填 |目标音频信息 |
|format |音频容器格式 |2 |string |s2s时必填，s2t时非必填 |pcm/ogg_opus |
|rate |音频采样率 |2 |int |s2s时必填，s2t时非必填 |默认为 24000。支持16000/24000

**注：** 

pcm 格式：16000Hz 采样率下默认 16 位整型（16bit），24000Hz 采样率下默认 32 位浮点型（32float）。

ogg_opus 格式：默认32 位浮点型（32float）且输出的采样率固定为48000，rate配置无法更改该格式的采样率； |


参数示例：

> Request中的`request_meta.session_id`为必填字段，不可缺省


```JSON
{
 "request_meta": {
 "session_id": "xxxxxxxx-xxxxxxxxxx-xxxxxxx-xxxxxxxxxx"
 }
 "event": event.Type_StartSession,
 "user": {
 "uid": "388808088185088",
 "did": "xxxxxx"
 },
 "source_audio": {
 "format": "wav",
 "rate": 16000,
 "bits": 16,
 "channel": 1,
 },
 "target_audio": {
 "format": "pcm",
 "rate": 48000
 },
 "request": {
 "mode": "s2s",
 "speaker_id": "zh_female_vv_uranus_bigtts", //可选，不传或者传错则使用默认行为（复刻输入音频音色）
 "speech_rate": 0,
 "source_language": "zh",
 "target_language": "en",
 "corpus": {
 "hot_words_list": ["xxxxx","xxxxx"],//(优先级最高)
 "boosting_table_id":"", //热词表id(优先级其次)
 "boosting_table_name":"", //热词表名(优先级最后)
 "correct_words":"{\"xxx\":\"xxx\",\"xxx\":\"xxx\"}", //正则替换词json格式的map字符串(优先级最高)
 "regex_correct_table_id":"", //正则替换词表id(优先级其次)
 "regex_correct_table_name":"", //正则替换词表名(优先级最后)
 "glossary_list": {
 "xxxxx": "yyy",
 "zzzzz": "www",
 },//(优先级最高)
 "glossary_table_id":"",//术语词表id(优先级其次)
 "glossary_table_name":"",//术语词表名(优先级最后)
 }
 }
}
```


**语种说明**


* 语种集

 
 |语种集 |语种数 |语种清单 |
 |---|---|---|
 |lang_8 |8 |中文、英文、德语、法语、西班牙语、印尼语、日语、葡萄牙语 |
 |lang_20 |20 |中文、英文、德语、法语、西班牙语、印尼语、日语、葡萄牙语、韩语、土耳其语、马来语、荷兰语、罗马尼亚语、波兰语、捷克语、阿拉伯语、泰语、越南语、俄语、意大利语 |
 |方言 |2 |粤语（yue\-CN）、上海话（sh\-CN） |
 

* 模式与语种匹配/约束关系

 
 |输入/输出模式 |语种设置特性及约束 |支持语种 |
 |---|---|---|
 |**语音到文本（S2T）** |* 源语种和目标语种必须指定

* 源语种 **或** 目标语种必须是中英

* 支持中英反转互译（zhen） |* 源语种：lang_20、方言

* 目标语种：lang_20 |
 |**语音到语音（S2S）\- 指定音色模式**

> 传入 speaker_id，支持 2 个公版音色

> * zh_female_vv_uranus_bigtts

> * zh_male_jingqiangkanye_emo_mars_bigtts |* 源语种和目标语种必须指定

* 目标语种必须为中英

* 支持中英反转互译（zhen） |* 源语种：lang_20、方言

* 目标语种：中英 |
 |**语音到语音（S2S）\- 声音复刻模式**

> 不传 speaker_id，自动复刻说话人声音 |* 源语种和目标语种必须指定

* 源语种 **或** 目标语种必须是中英

* 支持中英反转互译（zhen） |* 源语种：lang_8

* 目标语种：lang_8 |
 

* 语种代号及说明

 
 |语言 |参数值 |说明 |
 |---|---|---|
 |中文 |`zh` |中英语种之一 |
 |英文 |`en` |中英语种之一 |
 |德语 |`de` | |
 |法语 |`fr` | |
 |西班牙语 |`es` | |
 |印尼语 |`id` | |
 |日语 |`ja` | |
 |葡萄牙语 |`pt` | |
 |韩语 |`ko` | |
 |土耳其语 |`tr` | |
 |马来语 |`ms` | |
 |荷兰语 |`nl` | |
 |罗马尼亚语 |`ro` | |
 |波兰语 |`pl` | |
 |捷克语 |`cs` | |
 |阿拉伯语 |`ar` | |
 |泰语 |`th` | |
 |越南语 |`vi` | |
 |俄语 |`ru` | |
 |意大利语 |`it` | |
 |粤语 |`yue-CN` |方言，仅支持作为源语种 |
 |上海话 |`sh-CN` |方言，仅支持作为源语种 |
 |中英反转互译 |`zhen` |`source_language` 和 `target_language` 需同时传 `zhen`

> 示例：`你好，everyone` 翻译为 `Hello，大家` |
 

* 使用方式

 * `source_language` 和 `target_language` 均传上表中的参数值，例如中文传 `zh`，英文传 `en`。

 * `mode=s2t` 时返回文本结果，按“语音到文本（S2T）”的语种约束传参。

 * `mode=s2s` 且传入支持的 `speaker_id` 时，按“语音到语音（S2S）\- 指定音色模式”的语种约束传参。

 * `mode=s2s` 且不传或传入不支持的 `speaker_id` 时，按“语音到语音（S2S）\- 声音复刻模式”的语种约束传参。


#### 发送音频数据\-TaskRequest

Client 发送 建连请求后，再发送包含音频数据的 TaskRequest。音频应采用建立连接request 中指定的格式（音频格式、编解码器、采样率、声道）。二进制数据放在protobuf 的request体内部

例如在流式语音识别中如果每次发送 100ms 的音频数据，那么data中的 内容 就是 100ms 的音频数据。

**注意：需要等到收到服务端响应的SessionStarted后再发参数包及音频包**


* 具体的参数字段见下表：


|字段 |说明 |层级 |格式 |是否必填 |备注 |
|---|---|---|---|---|---|
|event |请求事件说明 |1 |enum (int32) |✓ |发送音频数据的的event 为200，见上文Event 字段描述 |
|source_audio |源音频相关配置 |1 |dict |✓ |源音频信息 |
|data |音频数据 |2 |bytes |✓ |音频流的二进制数据, 要求16khz,16bit,单通道wav/pcm, 建议80ms 一包 |


参数示例：

```JSON
{
 "event": event.Type_TaskRequest,
 "source_audio": {
 "data": "ff\xa2\xfe*\xfeB\xfe\xa3\xfe\x9c\xff\xe2\x0"
 }
}
```


#### 更新参数\-ConfigUpdate

用于在session中更新语料/干预词等

参数示例：

```JSON
{
 "event": event.Type_UpdateConfig,
 "request": {
 "mode": "s2s", // 注意：当前不支持在会话中切换语言及mode，如需切换，请重新建立连接
 "corpus": { // 用于在中间包修改热词和术语列表
 "hot_words_list": ["xxxxx","xxxxx"],//(优先级最高)
 "boosting_table_id":"", //热词表id(优先级其次)
 "boosting_table_name":"", //热词表名(优先级最后)
 "correct_words":"{\"xxx\":\"xxx\",\"xxx\":\"xxx\"}", //正则替换词json格式的map字符串(优先级最高)
 "regex_correct_table_id":"", //正则替换词表id(优先级其次)
 "regex_correct_table_name":"", //正则替换词表名(优先级最后)
 "glossary_list": {
 "xxxxx": "yyy",
 "zzzzz": "www",
 },//(优先级最高)
 "glossary_table_id":"",//术语词表id(优先级其次)
 "glossary_table_name":"",//术语词表名(优先级最后)
 }
 }
}
```


#### 结束session\-FinishSession

单独的结束事件，不带音频，在要发送的音频全部发送完毕后发送

参数示例：

```JSON
{
 "event": event.FinishSession
}
```


### 服务端

Client 发送请求，服务端都会返回response。格式具体见protobuf定义，具体关键字段说明如下：


|字段 |说明 |层级 |格式 |是否必填 |备注 |
|---|---|---|---|---|---|
|response_meta |响应元信息 |1 |dict | | |
|status_code |错误码 |2 |int | | |
|message |错误信息 |2 |string | | |
|billing |计量计费信息 |2 |dict | |仅计量计费\-UsageResponse event返回此字段 |
|duration_msec |音频的持续时长 |3 |int | |单位：毫秒 |
|items |计量计费详情 |3 |array | | |
|unit |token分类 |4 |string | |取值为：

output_text_tokens

output_audio_tokens

input_audio_tokens |
|quantity |消耗token量 |4 |float | | |
|event |响应事件 |1 |int | |响应事件标志，例如建联成功（SessionStarted 取值为150） |
|text |整个音频的识别结果文本 |1 |string | |原文或者译文 |
|data |响应数据 |1 |raw | |响应的二进制数据 |
|start_time |起始时间（毫秒） |1 |int | |仅当识别成功时填写 |
|end_time |结束时间（毫秒） |1 |int | |仅当识别成功时填写 |
|spk_chg |说话人是否发生了切换的标志 |1 |bool | |默认为false，在检测到说话人发生切换的那个句子的**SourceSubtitleStart**和**TranslationSubtitleStart**响应的响应体里会把此参数设置为true |
|muted_duration_ms |静音时间 | |int | |单位ms, 表示静音了多久，存在误差，不是精确值 |


#### 接收到建联成功\-SessionStarted

响应示例：

```Plain
{
 "event": event.Type_SessionStarted
}
```


#### 原文开始\-SourceSubtitleStart

标记原文开始发送，包含开始时间戳(startTime), 说话人切换信号(如开启相关功能)

```JSON
{
 "event": event.Type_SourceSubtitleStart,
 "start_time": xxx,
 "spk_chg": false //默认为false，如果检测到此句说话人发生切换，那么为true
}
```


#### 原文数据\-SourceSubtitleResponse

发送音频，要求16khz,16bit,单通道wav/pcm, 建议80ms一包

```JSON
{
 "event": event.Type_SourceSubtitleResponse,
 "text": "xxx" //原文文本
}
```


#### 原文结束\-SourceSubtitleEnd

```JSON
{
 "event": event.Type_SourceSubtitleEnd,
 "start_time": xxx,
 "end_time": xxx,
 "text": "xxx"
}
```


#### 译文开始\-TranslationSubtitleStart

```JSON
{
 "event": event.Type_TranslationSubtitleStart,
 "start_time": xxx,
 "spk_chg": false //默认为false，如果检测到此句说话人发生切换，那么为true
}
```


#### 译文数据\-TranslationSubtitleResponse

```JSON
{
 "event": event.Type_TranslationSubtitleResponse,
 "text": "xxx"
}
```


#### 译文结束\-TranslationSubtitleEnd

```JSON
{
 "event": event.Type_TranslationSubtitleEnd,
 "start_time": xxx,
 "end_time": xxx,
 "text": "xxx"
}
```


#### TTS开始\-TTSSentenceStart

```JSON
{
 "event": event.Type_TTSSentenceStart,
 "start_time": xxx
}
```


#### TTS数据\-TTSResponse

音频数据：data (音频数据，按设置的target_audio格式返回)，

```JSON
{
 "event": event.Type_TTSResponse,
 "data": "xxx"
}
```


#### TTS结束\-TTSSentenceEnd

```JSON
{
 "event": event.Type_TTSSentenceEnd,
 "data": "xxx",
 "start_time": xxx,
 "end_time": xxx
}
```


#### 计量计费\-UsageResponse

```JSON
{
 "event": event.Type_UsageResponse,
 "responseMeta": {
 "session_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 "status_code": 20000000, // 成功的状态码
 "message": "OK",
 "billing": { // 计费详情
 "items": [
 {
 "unit": "output_text_tokens", // API调用token, 文本输出
 "quantity": 15.0 // 消耗的token量
 },
 {
 "unit": "output_audio_tokens", // API调用token, 音频输出
 "quantity": 11.0 // 消耗的token量
 },
 {
 "unit": "input_audio_tokens", // API调用token，音频输入
 "quantity": 4.0 // 消耗的token量
 }
 ],
 "duration_msec": 640 // 音频的持续时间,单位：毫秒
 }
 }
}
```


#### 会话正常结束\-SessionFinished

```JSON
{
 "event": event.Type_SessionFinished
}
```


#### 会话失败\-SessionFailed

```JSON
{
 "event": event.Type_SessionFailed
}
```


#### 返回AudioMuted

vad检测到静音时会响应静音事件，第一次响应为静音2s后，之后每静音约1s返回一次wen

```JSON

{
 "event": event.Type_Type_AudioMuted,
 "muted_duration_ms": xxx //单位ms, 表示静音了多久，存在误差，不是精确值
}
```


### Error message from server

当 server 发现无法解决的二进制/传输协议问题时，将发送 Error message from server 消息（例如，client 以 server 不支持的序列化格式发送消息）。格式见前文response_meta字段：


## 错误码


|错误码 |含义 |说明 |
|---|---|---|
|20000000 |成功 | |
|45000001 |请求参数无效 |请求参数缺失必需字段 / 字段值无效 / 重复请求。 |
|45000002 |空音频 | |
|45000081 |等包超时 | |
|45000151 |音频格式不正确 | |
|550xxxxx |服务内部处理错误 | |
|55000031 |服务器繁忙 |服务过载，无法处理当前请求。 |
