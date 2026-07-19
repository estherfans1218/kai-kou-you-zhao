export type RealStory = {
  id: string;
  kind: "solved" | "case";
  category: string;
  relation: string;
  title: string;
  scene: string;
  speakerLine: string;
  responses: {
    gentle: string;
    firm: string;
    direct: string;
  };
  followUp: {
    opponent: string;
    answer: string;
  };
  outcome: string;
  origin: string;
  sourceUrl?: string;
  seedLikes: number;
  seedComments: string[];
};

export const storyCases: RealStory[] = [
  {
    id: "story-work-blame",
    kind: "solved",
    category: "职场协作",
    relation: "前同事",
    title: "离职半年，旧项目出问题还想让我背锅",
    scene: "项目上线后出现故障。会上有人说这个模块最初是我负责的，暗示问题应该由我解释，但我离职时已经完成交接。",
    speakerLine: "这个模块本来就是你做的，现在出了问题你总得负责吧？",
    responses: {
      gentle: "我可以协助补充历史信息。先把时间线对一下：我在离职前已经按清单完成交接，之后的修改、测试和上线确认需要请当前负责人补充。",
      firm: "我愿意提供离职前的资料，但不能接受笼统归责。请明确具体故障发生在哪次修改、由谁验收，我们按记录定位。",
      direct: "“最初做过”不等于对离职后的所有变更负责。请停止用模糊说法归责，直接看交接记录和版本日志。",
    },
    followUp: {
      opponent: "大家都在解决问题，你为什么只想着撇清责任？",
      answer: "厘清责任不是拒绝解决问题。只有先确认故障环节和当前负责人，补救才不会再次出错；我能提供的历史信息会配合提供。",
    },
    outcome: "把交接邮件和版本时间线发到群里后，讨论回到了故障发生后的修改记录，没有再围绕个人态度争执。",
    origin: "来自公开职场分享 · 已匿名改写",
    sourceUrl: "https://www.sohu.com/a/716491541_121118940",
    seedLikes: 328,
    seedComments: ["先把时间线摆出来真的很重要。", "最喜欢坚定版，不吵架但很清楚。"],
  },
  {
    id: "story-leave-on-time",
    kind: "solved",
    category: "职场边界",
    relation: "直属上级",
    title: "工作做完按时走，领导笑着问“这么早？”",
    scene: "当天安排的工作已经完成，准备下班时领导用开玩笑的语气评价离开时间，周围还有其他同事。",
    speakerLine: "今天这么早就走呀？看来最近挺轻松嘛。",
    responses: {
      gentle: "今天计划里的 A 和 B 都完成了。我先走啦，如果还有紧急事项您现在告诉我，我确认一下安排。",
      firm: "今天的工作已经按计划交付。如果有新增任务，我们可以确认优先级和完成时间。",
      direct: "按时下班不代表工作轻松。我的任务已经完成，有新任务请直接说明，不用用离开时间判断投入程度。",
    },
    followUp: {
      opponent: "别人都还没走，你就不能有点团队精神？",
      answer: "团队协作我会配合，但需要对应具体任务。现在是哪项工作需要我留下、预计到几点？我们确认后我来安排。",
    },
    outcome: "没有围绕“努力不努力”自证，而是要求明确任务。之后临时工作会直接说明内容和截止时间。",
    origin: "来自公开问答 · 已匿名改写",
    sourceUrl: "https://www.zhihu.com/question/617196411/answer/3166983526",
    seedLikes: 516,
    seedComments: ["先报完成进度，再问新任务，确实更安全。"],
  },
  {
    id: "story-public-criticism",
    kind: "case",
    category: "职场沟通",
    relation: "资深同事",
    title: "新人总被同事当着所有人挑缺点",
    scene: "同事不只指出工作问题，还经常在会议上评价我“能力不行”“新人就是想得简单”，详细建议却从来不说。",
    speakerLine: "这都能做错？新人做事果然还是不靠谱。",
    responses: {
      gentle: "这部分确实需要调整。你能指出具体错误和标准吗？详细建议我们会后对一下，我马上改。",
      firm: "工作问题请具体指出，我会负责修改；但请不要把一次错误扩大成对个人能力的评价。",
      direct: "你可以评价这份工作，但不能借工作问题当众贬低我。请说具体哪一步错了。",
    },
    followUp: {
      opponent: "我是在教你，怎么还听不得批评？",
      answer: "我愿意接受具体批评，所以才请你说清问题和标准。人格化评价不能帮助我修改，我们继续谈工作本身。",
    },
    outcome: "当事人后来开始在每次评价后追问具体标准，并主动约会后确认。公开的能力评价明显减少。",
    origin: "来自真实经历讨论 · 已匿名改写",
    sourceUrl: "https://www.zhihu.com/en/answer/4153242546",
    seedLikes: 241,
    seedComments: ["接受批评不等于接受羞辱。", "第二句可以直接背下来。"],
  },
  {
    id: "story-marriage-pressure",
    kind: "case",
    category: "家庭边界",
    relation: "父母",
    title: "家人发来相亲照片，说“加个好友又不会怎样”",
    scene: "明确表示暂时不想相亲后，家人仍不断发来对象资料，并把拒绝解释成挑剔、不懂事。",
    speakerLine: "先加个微信又不会少块肉，你怎么连这点面子都不给？",
    responses: {
      gentle: "我知道你是关心我，但我现在没有认识相亲对象的计划。请先不要替我答应，等我准备好会主动告诉你。",
      firm: "是否加好友由我决定。没有得到我同意前，请不要把我的联系方式给别人，也不要替我安排见面。",
      direct: "我已经拒绝了。继续替我安排不是关心，而是在越过我的决定。这个话题到这里。",
    },
    followUp: {
      opponent: "我们还不是为了你好，以后后悔别怪我们。",
      answer: "我知道你们担心，但选择和结果都由我承担。你们可以表达一次意见，不能替我做决定。",
    },
    outcome: "家人没有立刻改变，但当事人不再逐个讨论相亲对象条件，只重复同一条边界，沟通消耗逐渐减少。",
    origin: "来自女性催婚经历 · 已匿名改写",
    sourceUrl: "https://m.thepaper.cn/newsDetail_forward_16322098",
    seedLikes: 603,
    seedComments: ["理由会被反驳，决定不需要辩论。"],
  },
  {
    id: "story-durian",
    kind: "solved",
    category: "消费维权",
    relation: "水果店商家",
    title: "榴莲外表正常，回家打开却熟过头",
    scene: "购买当天切开后发现果肉已经熟过头，带着订单、照片和剩余果肉回店沟通，商家直接用“切开不退”结束讨论。",
    speakerLine: "都切开吃过了，谁知道是不是你放坏的？不满意就报警。",
    responses: {
      gentle: "这是今天购买后马上切开的，时间、照片和剩余果肉都在。我们先核对一下，希望按质量问题协商退换。",
      firm: "我反馈的是购买当天发现的质量问题，不是口味偏好。请给出退换处理，或者明确记录拒绝处理的理由。",
      direct: "报警不是处理商品质量问题的答案。证据我已经保留，请现在明确：退换，还是拒绝处理并由我向平台和监管渠道反馈。",
    },
    followUp: {
      opponent: "我们卖出去的时候明明是好的，反正不能退。",
      answer: "外壳看起来正常不等于内部没有问题。现在有购买时间和果肉状态可核对，请不要先假设责任，直接给出处理结论。",
    },
    outcome: "对话从互相指责转为核对凭证，并留下商家答复；即使现场无法解决，也能继续通过正式渠道处理。",
    origin: "来自消费投诉 · 已匿名改写",
    sourceUrl: "https://tousu.sina.com.cn/complaint/view/17387225224?sld=54a5d0d93af7c1fd910197f6a72fbd63",
    seedLikes: 189,
    seedComments: ["一定要拍完整开箱视频。", "坚定版既礼貌又有结果。"],
  },
  {
    id: "story-restaurant",
    kind: "case",
    category: "餐厅沟通",
    relation: "餐厅老板",
    title: "二十多人等菜一小时，老板却说“不可能跪着服务”",
    scene: "聚餐催了三次，主菜仍然没上。顾客询问解决方案时，老板把诉求描述成要求服务人员卑微，并提出把没上的菜退掉。",
    speakerLine: "我们是服务行业，但也不可能跪下来给你们服务，要不就退菜。",
    responses: {
      gentle: "我们没有要求任何人低头，只是二十多人已经等了一个多小时。请确认剩余菜多久能上，不能按时上的我们再决定是否取消。",
      firm: "请不要把正常询问说成要求你们卑微服务。现在请给出明确上菜时间，以及对长时间等待的处理方案。",
      direct: "没人让你跪。我们问的是为什么晚来的桌已经上齐、我们的菜何时能上。请回答问题，不要转移成尊严争论。",
    },
    followUp: {
      opponent: "厨房就是忙，我已经解释很多次了。",
      answer: "我们听到了原因，但还没有得到方案。请直接确认：还要等多久、哪些菜能上、哪些菜现在取消。",
    },
    outcome: "争吵后一度很尴尬，但菜很快上齐。当事人复盘认为，如果更早锁定上菜时间和处理方案，可能不必升级到大声争执。",
    origin: "来自用户提供的公开视频情境 · 已匿名改写",
    seedLikes: 437,
    seedComments: ["“解释不是方案”真的说到点上。", "带长辈吃饭时更需要不升级冲突。"],
  },
];
