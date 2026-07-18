export type Category = "推荐" | "职场" | "家庭" | "社交" | "消费" | "边界";

export type CaseCard = {
  id: string;
  category: Exclude<Category, "推荐">;
  relation: string;
  risk: "低风险" | "需判断" | "先保安全";
  quote: string;
  situation: string;
  move: string;
  response: string;
  reason: string;
  accent: "violet" | "coral" | "mint" | "yellow";
  rounds?: Array<{
    opponent: string;
    response: string;
    note: string;
  }>;
};

export const cases: CaseCard[] = [
  {
    id: "case-01",
    category: "职场",
    relation: "平级同事",
    risk: "低风险",
    quote: "这个方案是不是有点想当然了？能力不够就别硬撑。",
    situation: "对方用笼统评价，当众否定你的专业能力。",
    move: "要求具体化",
    response: "具体是哪一部分让你觉得想当然？我们可以直接看数据。",
    reason: "不接情绪，把举证责任推回对方。",
    accent: "violet",
    rounds: [
      {
        opponent: "数据谁不会看？问题就是你的思路还不成熟。",
        response: "如果你有不同判断，可以指出对应的数据或环节，我们逐项讨论。",
        note: "对方继续模糊评价时，重复要求具体依据。",
      },
      {
        opponent: "你怎么总喜欢抬杠？听不懂别人是在给你建议吗？",
        response: "我愿意听建议，所以才希望把建议说具体，这样我才能真正调整。",
        note: "把“抬杠”的帽子拿掉，再把对话拉回工作目标。",
      },
    ],
  },
  {
    id: "case-02",
    category: "家庭",
    relation: "长辈",
    risk: "需判断",
    quote: "女孩子别那么拼，找个好人嫁了才是正经事。",
    situation: "关心被包装成对你人生选择的否定。",
    move: "接住关心，再划界",
    response: "我知道你是关心我，但什么生活适合我，我想自己决定。",
    reason: "承认善意，不等于交出决定权。",
    accent: "coral",
    rounds: [
      {
        opponent: "我们吃过的盐比你吃过的饭都多，还会害你吗？",
        response: "我相信你们是为我好，但经验可以参考，决定和结果需要我自己承担。",
        note: "不否定长辈经验，也不把决定权让出去。",
      },
    ],
  },
  {
    id: "case-03",
    category: "社交",
    relation: "朋友",
    risk: "低风险",
    quote: "开个玩笑而已，你怎么这么敏感？",
    situation: "对方把越界说成玩笑，再把责任推给你。",
    move: "命名感受",
    response: "好不好笑可以有分歧，但我已经说了这让我不舒服。",
    reason: "不争论动机，只确认你的真实感受。",
    accent: "yellow",
    rounds: [
      {
        opponent: "大家都没觉得有问题，就你事多。",
        response: "别人是否介意由别人决定，我现在是在告诉你我的边界。",
        note: "不进入少数服从多数的陷阱。",
      },
    ],
  },
  {
    id: "case-04",
    category: "边界",
    relation: "群聊成员",
    risk: "需判断",
    quote: "你不回复，那我们就当你默认同意了。",
    situation: "对方用时间压力，替你做出决定。",
    move: "拒绝被代答",
    response: "没有回复不代表同意。这件事我需要确认后再给答复。",
    reason: "拿回解释权，也为自己争取判断时间。",
    accent: "mint",
  },
  {
    id: "case-05",
    category: "职场",
    relation: "直属上级",
    risk: "需判断",
    quote: "这个任务你顺手做一下，也花不了多少时间。",
    situation: "额外工作被说得很轻，原有优先级却没有调整。",
    move: "确认优先级",
    response: "可以，我手上还有 A 和 B，您希望我先暂停哪一个？",
    reason: "不直接对抗，把取舍变成明确的工作决策。",
    accent: "violet",
    rounds: [
      {
        opponent: "年轻人要有担当，这点事还要算得这么清楚？",
        response: "我愿意承担，但为了保证交付质量，需要您确认今晚最优先的是哪一项。",
        note: "不争论态度，继续要求明确工作取舍。",
      },
      {
        opponent: "都重要，你自己想办法。",
        response: "明白。我会先完成这项临时任务，A 和 B 将顺延，我稍后邮件同步新的时间安排。",
        note: "无法获得取舍时，主动给出方案并书面留痕。",
      },
    ],
  },
  {
    id: "case-06",
    category: "家庭",
    relation: "家人",
    risk: "低风险",
    quote: "我们还不都是为了你好，你怎么一点都不领情？",
    situation: "关心与服从被绑定在了一起。",
    move: "分开感谢与决定",
    response: "我知道你们担心我，也感谢你们，但最后的决定还是要由我承担。",
    reason: "感谢关系里的付出，同时保留选择权。",
    accent: "coral",
  },
  {
    id: "case-07",
    category: "边界",
    relation: "群聊熟人",
    risk: "需判断",
    quote: "不就是把你那段私聊截图发群里了吗？又没说你坏话，至于吗？",
    situation: "对方未经同意公开私聊，又用“没说坏话”淡化越界行为。",
    move: "指出行为—要求撤回—明确以后",
    response: "请把截图撤回。那是私聊内容，我没有同意公开；以后分享涉及我的内容前，请先征得我同意。",
    reason: "不纠缠对方有没有恶意，只处理未经允许公开这件具体行为。",
    accent: "mint",
    rounds: [
      {
        opponent: "大家都已经看到了，现在撤回还有什么用？",
        response: "已经有人看到不代表可以继续保留。请先撤回，也请在群里说明这是未经我同意发出的。",
        note: "结果无法完全逆转时，仍然要求停止传播并修正公开叙事。",
      },
    ],
  },
  {
    id: "case-08",
    category: "社交",
    relation: "饭局熟人",
    risk: "需判断",
    quote: "大家都喝了，你不喝是不是看不起我们？",
    situation: "个人选择被偷换成对关系的态度。",
    move: "拒绝错误前提",
    response: "我今天不喝酒，但不影响我认真和大家吃这顿饭。",
    reason: "拒绝被二选一，重新定义你的参与方式。",
    accent: "yellow",
    rounds: [
      {
        opponent: "不喝就是不给我面子，今天必须喝一杯。",
        response: "我的心意不需要用喝酒证明。饮料我陪大家碰杯，酒我不喝。",
        note: "提供替代参与方式，但不松动核心边界。",
      },
    ],
  },
  {
    id: "case-09",
    category: "消费",
    relation: "水果店商家",
    risk: "需判断",
    quote: "榴莲都切开吃了，不能退。你觉得有问题就报警。",
    situation: "商家把商品质量争议转成情绪对抗，跳过了具体处理方案。",
    move: "固定事实—明确诉求—保留记录",
    response: "我反馈的是购买后发现熟过头的质量问题，不是口味偏好。我保留了购买记录、照片和剩余果肉，希望先协商退换。",
    reason: "不跟着“报警”的威胁走，始终围绕事实、证据和明确诉求沟通。",
    accent: "mint",
    rounds: [
      {
        opponent: "谁知道是不是你回家放坏的？我们卖出去的时候明明是好的。",
        response: "这是今天购买后马上切开的，购买时间和果肉状态都有记录。我们可以一起核对，而不是先假设是谁的责任。",
        note: "把争论从互相指责拉回可核对的时间和证据。",
      },
      {
        opponent: "反正我们不退，不满意你就报警。",
        response: "是否报警由你决定。我先把诉求说清楚：请给出退换处理，或者明确记录你们拒绝处理的答复，我会保留现有凭证再通过正式渠道反映。",
        note: "不升级口角，也不被威胁带偏；留下明确答复后结束无效争论。",
      },
    ],
  },
  {
    id: "case-10",
    category: "消费",
    relation: "餐厅老板",
    risk: "需判断",
    quote: "虽然我们是服务行业，但我们也不能跪下来给你们服务。要不就把没上的菜退掉。",
    situation: "顾客等待过久提出问题，商家却把合理诉求偷换成“要求卑微服务”。",
    move: "拆掉情绪命题—给出解决选项",
    response: "我们没有要求任何人跪下，只是在询问等了一个多小时仍未上菜怎么解决。请给出明确的上菜时间和处理方案。",
    reason: "拒绝被带入尊严争论，把沟通重新拉回等待时间和可执行解决方案。",
    accent: "coral",
    rounds: [
      {
        opponent: "今天厨房就是忙，我们已经解释过很多次了。",
        response: "我们理解厨房忙，但解释原因不等于解决问题。请确认剩余菜品多久能上齐，不能按时上的请直接说明。",
        note: "承认客观困难，同时区分“解释原因”和“提供方案”。",
      },
      {
        opponent: "那就给你们把没上的菜退了，这总可以了吧？",
        response: "退菜是一个方案，但我们二十多人已经等待很久。请先确认能否在约定时间内上齐；如果不能，请取消未上菜品，并说明对这次长时间等待的处理方案。",
        note: "给对方清晰选项，不靠提高音量争取结果。",
      },
      {
        opponent: "家人过来劝你：算了，别吵了，大家先回去坐。",
        response: "好，我先停下来。麻烦店家把最终处理和上菜时间确认清楚，我们回包间等结果。",
        note: "及时停下不等于认输；确认结果后离场，能同时保护诉求和关系。",
      },
    ],
  },
];

export const categories: Category[] = ["推荐", "职场", "家庭", "社交", "消费", "边界"];
