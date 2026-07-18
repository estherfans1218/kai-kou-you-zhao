export type StoryCase = {
  id: string;
  category: string;
  title: string;
  summary: string;
  turningPoint: string;
  outcome: string;
  lesson: string;
  sourceLabel: string;
};

export const storyCases: StoryCase[] = [
  {
    id: "story-durian",
    category: "消费维权",
    title: "切开才发现榴莲熟过头，店家却说“要不你报警”",
    summary: "购买时外观看起来正常，回家切开试吃后发现果肉已经熟过头。回店沟通时，商家用“切开不退”和“报警”结束讨论。",
    turningPoint: "不再争论谁更有道理，而是固定购买时间、果肉状态、照片和剩余商品，再重复明确的退换诉求。",
    outcome: "这类情境的目标不是把店家吵服，而是获得明确处理答复，并为后续正式渠道保留完整记录。",
    lesson: "对方升级情绪时，把对话拉回事实、证据和一个可执行诉求。",
    sourceLabel: "用户提供情境 · 复合整理",
  },
  {
    id: "story-restaurant",
    category: "餐厅沟通",
    title: "等菜一个多小时，老板却说“不能跪下来服务”",
    summary: "二十多人聚餐，等待很久仍只有凉菜。提出问题后，老板把合理的解决诉求转成了“要求服务人员卑微”。",
    turningPoint: "直接拆掉这个情绪命题：没有人要求谁跪下。现在只需要明确剩余菜品多久能上、不能上的如何取消、等待问题如何处理。",
    outcome: "激烈争吵可能短期推动结果，却也会带来关系压力。更稳的做法是确认方案、留下答复，然后及时收束离场。",
    lesson: "解释原因不等于解决问题；沟通要持续追问时间、方案和责任人。",
    sourceLabel: "公开内容启发 · 匿名复合整理",
  },
];
