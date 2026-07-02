import { Question, StudyPlan, StudentProfile, ClassStudentProgress, StudentFeedback, TestAttempt } from './types';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    stem: '急性前壁心肌梗死发生后，患者在24小时内最常见、也是最主要的死亡原因的心律失常是：',
    type: 'A1',
    options: [
      'A. 房性期前收缩与房性心动过速',
      'B. 室性期前收缩与室性心动过速/室颤',
      'C. 房室传导阻滞与室内传导阻滞',
      'D. 心房颤动与心房扑动'
    ],
    answer: 'B',
    explanation: '急性心肌梗死早期（特别是24小时内）最常见的死亡原因和心律失常是室性心律失常，其中以室性期前收缩（室早）及室性心动过速、心室颤动（室颤）最为多见和危险。',
    knowledgePoint: '心血管系统 - 急性心肌梗死并发症',
    difficulty: '中',
    category: '内科学'
  },
  {
    id: 'q2',
    stem: '关于大叶性肺炎的叙述，下列哪项是不正确的：',
    type: 'A1',
    options: [
      'A. 最常见的致病菌是肺炎链球菌',
      'B. 病变呈大叶或段分布的急性纤维素性渗出性炎症',
      'C. 典型患者临床常表现为铁锈色痰',
      'D. 治愈后通常会留有明显的肺组织结构纤维化或瘢痕'
    ],
    answer: 'D',
    explanation: '大叶性肺炎治愈后，肺泡内纤维素被中性粒细胞释放的蛋白酶溶解吸收，肺组织结构可完全恢复正常，通常不留瘢痕或纤维化。若病变未及时消散，可发生机化（肺肉质变），但这非典型结局。',
    knowledgePoint: '呼吸系统 - 大叶性肺炎病理特征',
    difficulty: '易',
    category: '病理学'
  },
  {
    id: 'q3',
    stem: '正常生理状态下，剧烈运动导致心输出量急剧增加的主要调节机制是：',
    type: 'A1',
    options: [
      'A. 仅依靠外周阻力显著减小',
      'B. 仅依靠舒张末期容积（异长自身调节）增加',
      'C. 心率加快与心肌收缩力增强（等长自身调节）共同作用',
      'D. 副交感神经兴奋性增强导致搏出量增加'
    ],
    answer: 'C',
    explanation: '剧烈运动时，交感神经显著兴奋，释放去甲肾上腺素作用于心肌β1受体，导致心率加快、心肌收缩力增强。在心率和收缩力共同提升下，每搏输出量和心输出量均急剧增加。',
    knowledgePoint: '生理学 - 心输出量调节机制',
    difficulty: '中',
    category: '生理学'
  },
  {
    id: 'q4',
    stem: '糖皮质激素具有强大的抗炎和免疫抑制作用，以下关于其抗炎作用机制的描述，不包括：',
    type: 'A1',
    options: [
      'A. 稳定溶酶体膜，减少溶酶体酶释放',
      'B. 诱导诱导型一氧化氮合酶（iNOS）的表达，增加毛细血管通透性',
      'C. 抑制磷脂酶A2，减少前列腺素和白三烯的合成',
      'D. 抑制炎症相关的转录因子（如NF-κB）的活性'
    ],
    answer: 'B',
    explanation: '糖皮质激素的作用是降低（而非增加）毛细血管通透性，抑制炎性渗出。它能够抑制iNOS的表达，减少一氧化氮的生成，从而缓解局部血管扩张和渗出。',
    knowledgePoint: '药理学 - 糖皮质激素抗炎机制',
    difficulty: '难',
    category: '药理学'
  },
  {
    id: 'q5',
    stem: '下列临床表现中，哪项不是由左心衰竭引起的呼吸困难的典型临床特点：',
    type: 'A1',
    options: [
      'A. 呼吸困难在平卧时加重，坐起或端坐时减轻',
      'B. 常在夜间睡眠中憋醒，伴有哮鸣音（阵发性夜间呼吸困难）',
      'C. 呼吸困难的严重程度与体力活动度无关，呈突发性',
      'D. 严重时可咳出大量粉红色泡沫样痰（急性肺水肿）'
    ],
    answer: 'C',
    explanation: '左心衰竭引起的呼吸困难与体力活动密切相关，通常表现为劳力性呼吸困难，即活动时出现或加重，休息时减轻。只有在急性肺水肿发作时才表现为突发和端坐呼吸。',
    knowledgePoint: '诊断学 - 呼吸困难临床鉴别',
    difficulty: '难',
    category: '诊断学'
  }
];

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  id: 'std_01',
  name: '张同学',
  stage: '医科本科生',
  examGoal: '执业医师资格考试',
  avatar: '👨‍⚕️',
  joinedPlanIds: ['plan_01']
};

export const INITIAL_STUDY_PLANS: StudyPlan[] = [
  {
    id: 'plan_01',
    name: '2026年执业医师资格考试“临床医学基础”通关计划',
    target: '执业医师资格考试',
    stage: '医科本科生',
    duration: '45天',
    syllabus: ['心血管系统', '呼吸系统', '消化系统', '泌尿系统'],
    phases: [
      { id: 'p1', name: '阶段 1：核心生理学与病理学基础', type: 'practice', questionCount: 2, difficulty: '易', requirement: '正确率达 60% 以上' },
      { id: 'p2', name: '阶段 2：心肺系统常见病专项练习', type: 'practice', questionCount: 2, difficulty: '中', requirement: '正确率达 70% 以上' },
      { id: 'p3', name: '阶段 3：执医高频错题与难点攻克', type: 'practice', questionCount: 1, difficulty: '难', requirement: '正确率达 80% 以上' },
      { id: 'p4', name: '阶段 4：临床执业医师模拟测验', type: 'quiz', questionCount: 5, difficulty: '中', requirement: '参与并完成测验，检验综合实力' }
    ],
    status: 'active',
    studentCount: 154,
    completionRate: 64,
    averageScore: 78.5,
    remediationRules: '任一阶段正确率低于60%，或模拟测验知识点正确率低于70%，即触发“错题知识点补盲加练包”。',
    createdAt: '2026-05-10'
  },
  {
    id: 'plan_02',
    name: '2026年医学研究生入学考试（西医综合）高分冲刺计划',
    target: '医学研究生入学考试',
    stage: '医学研究生',
    duration: '30天',
    syllabus: ['生理学高阶', '生物化学与分子生物学', '病理诊断学'],
    phases: [
      { id: 'p2_1', name: '阶段 1：西医综合生化高频考点强化', type: 'practice', questionCount: 2, difficulty: '中', requirement: '正确率达 70% 以上' },
      { id: 'p2_2', name: '阶段 2：高难病理诊断与机制分析', type: 'practice', questionCount: 3, difficulty: '难', requirement: '正确率达 75% 以上' },
      { id: 'p2_3', name: '阶段 3：西医综合综合模拟冲刺卷', type: 'quiz', questionCount: 5, difficulty: '难', requirement: '完成模拟大考' }
    ],
    status: 'published',
    studentCount: 88,
    completionRate: 42,
    averageScore: 71.2,
    remediationRules: '综合测验单个考点连错2题，自动触发AI针对性解析与相似题加练。',
    createdAt: '2026-06-15'
  },
  {
    id: 'plan_03',
    name: '住院医师规范化培训结业大考“急诊与重症医学”冲刺计划',
    target: '住院医师规范化培训结业考试',
    stage: '住培医师',
    duration: '60天',
    syllabus: ['急诊医学', '重症医学', '心肺复苏与高级生命支持'],
    phases: [
      { id: 'p3_1', name: '阶段 1：急危重症早期识别与处理', type: 'practice', questionCount: 3, difficulty: '中', requirement: '正确率达 80% 以上' },
      { id: 'p3_2', name: '阶段 2：呼吸机与血流动力学监测', type: 'practice', questionCount: 2, difficulty: '难', requirement: '正确率达 80% 以上' },
      { id: 'p3_3', name: '阶段 3：住培结业急诊模拟考核', type: 'quiz', questionCount: 5, difficulty: '中', requirement: '及格分数 80分' }
    ],
    status: 'publishable',
    studentCount: 0,
    completionRate: 0,
    remediationRules: '任意模拟测验未达到80分，自动开启“核心技能与理论知识补盲包”，加练15题并要求复测。',
    createdAt: '2026-06-28'
  },
  {
    id: 'plan_04',
    name: '2026年医学专升本“基础医学理论”起航计划',
    target: '医学专升本考试',
    stage: '医科本科生',
    duration: '90天',
    syllabus: ['解剖学基础', '组织胚胎学', '生理学大纲'],
    phases: [
      { id: 'p4_1', name: '阶段 1：人体解剖学骨骼与肌肉系统', type: 'practice', questionCount: 2, difficulty: '易', requirement: '正确率达 60% 以上' },
      { id: 'p4_2', name: '阶段 2：消化与呼吸系统解剖重点', type: 'practice', questionCount: 2, difficulty: '易', requirement: '正确率达 60% 以上' }
    ],
    status: 'draft',
    studentCount: 0,
    completionRate: 0,
    remediationRules: '大纲章节练习错题累计3道以上，启动基础概念讲解与概念自测。',
    createdAt: '2026-07-01'
  }
];

export const INITIAL_CLASS_PROGRESS: ClassStudentProgress[] = [
  {
    studentId: 'std_01',
    name: '张同学（你）',
    stage: '医科本科生',
    planId: 'plan_01',
    progress: 75,
    avgCorrectRate: 80,
    testScore: 80,
    weakPoints: ['药理学 - 糖皮质激素抗炎机制'],
    remediationStatus: '已生成未开始',
    remediationImprovement: null,
    lastActive: '2026-07-02 09:30'
  },
  {
    studentId: 'std_02',
    name: '李建国',
    stage: '医科本科生',
    planId: 'plan_01',
    progress: 100,
    avgCorrectRate: 85,
    testScore: 90,
    weakPoints: ['诊断学 - 呼吸困难临床鉴别'],
    remediationStatus: '已完成',
    remediationImprovement: 25,
    lastActive: '2026-07-01 16:45'
  },
  {
    studentId: 'std_03',
    name: '王小敏',
    stage: '医科本科生',
    planId: 'plan_01',
    progress: 50,
    avgCorrectRate: 55,
    testScore: null,
    weakPoints: ['心血管系统 - 急性心肌梗死并发症', '药理学 - 糖皮质激素抗炎机制'],
    remediationStatus: '加练中',
    remediationImprovement: null,
    lastActive: '2026-07-02 10:15'
  },
  {
    studentId: 'std_04',
    name: '赵大勇',
    stage: '医科本科生',
    planId: 'plan_01',
    progress: 25,
    avgCorrectRate: 40,
    testScore: null,
    weakPoints: ['呼吸系统 - 大叶性肺炎病理特征', '生理学 - 心输出量调节机制'],
    remediationStatus: '已生成未开始',
    remediationImprovement: null,
    lastActive: '2026-06-30 14:20'
  },
  {
    studentId: 'std_05',
    name: '陈静文',
    stage: '医科本科生',
    planId: 'plan_01',
    progress: 100,
    avgCorrectRate: 95,
    testScore: 100,
    weakPoints: [],
    remediationStatus: '未触发',
    remediationImprovement: null,
    lastActive: '2026-07-02 11:00'
  }
];

export const INITIAL_FEEDBACKS: StudentFeedback[] = [
  {
    id: 'fb_1',
    studentId: 'std_03',
    studentName: '王小敏',
    questionId: 'q4',
    questionStem: '糖皮质激素具有强大的抗炎和免疫抑制作用，以下关于其抗炎作用机制的描述，不包括...',
    feedbackType: '解析模糊',
    content: '关于转录因子干扰和溶酶体膜的部分写得不够通俗，希望能配合分子机制图解，住培考试常考这一题。',
    status: 'pending'
  },
  {
    id: 'fb_2',
    studentId: 'std_02',
    studentName: '李建国',
    questionId: 'q2',
    questionStem: '关于大叶性肺炎的叙述，下列哪项是不正确的...',
    feedbackType: '答案错漏',
    content: '选项D的文字在教材第9版中好像有修改，能否核实一下表述是否严谨？',
    status: 'accepted',
    processedAt: '2026-07-01 10:00',
    reply: '已核实。选项D中的“通常会留有明显肺组织结构纤维化或瘢痕”确实为错误叙述，正确情况是不留瘢痕，我们修改了题干选项叙述，使其完全符合第九版病理学教材口径。'
  }
];

export const INITIAL_TEST_ATTEMPT: TestAttempt = {
  id: 'att_01',
  studentId: 'std_01',
  planId: 'plan_01',
  type: 'quiz',
  score: 80,
  maxScore: 100,
  totalQuestions: 5,
  correctCount: 4,
  completedAt: '2026-07-02 09:30',
  weakPoints: ['药理学 - 糖皮质激素抗炎机制'],
  answers: {
    'q1': 'B', // Correct (B)
    'q2': 'D', // Correct (D)
    'q3': 'C', // Correct (C)
    'q4': 'C', // Wrong (C is correct but is NOT excluded. Correct answer is B which is excluded)
    'q5': 'C'  // Correct (C)
  }
};
