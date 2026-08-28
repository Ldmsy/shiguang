import 'package:flutter/material.dart';

void main() => runApp(const ShiguangApp());
const ink = Color(0xFF203932),
    pine = Color(0xFF2C695C),
    mist = Color(0xFFF2F6F2),
    paper = Color(0xFFFFFDF8),
    line = Color(0xFFDDE6DF);

class ShiguangApp extends StatelessWidget {
  const ShiguangApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: '拾光',
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: pine, surface: paper),
      scaffoldBackgroundColor: paper,
      useMaterial3: true,
      fontFamily: 'NotoSansSC',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: ink,
          height: 1.2,
        ),
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
        titleLarge: TextStyle(
          fontSize: 19,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
        bodyLarge: TextStyle(fontSize: 16, height: 1.6, color: ink),
        bodyMedium: TextStyle(
          fontSize: 14,
          height: 1.5,
          color: Color(0xFF60706A),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: pine, width: 1.5),
        ),
      ),
    ),
    home: const AuthGate(),
  );
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});
  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool register = false, loggedIn = false;
  final phone = TextEditingController(text: '13800138000'),
      password = TextEditingController(text: 'Shiguang2026!');
  @override
  void dispose() {
    phone.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (loggedIn) return const HomeShell();
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const BrandMark(),
                  const SizedBox(height: 42),
                  Text(
                    register ? '创建你的拾光账户' : '登录个人成长空间',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    register ? '完成验证，开始保存属于你的故事。' : '继续记录故事、整理能力线索，并与同路人保持联系。',
                  ),
                  const SizedBox(height: 28),
                  TextField(
                    controller: phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: '手机号账号',
                      prefixIcon: Icon(Icons.phone_iphone_rounded),
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (register) ...[
                    const TextField(
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: '验证码',
                        prefixIcon: Icon(Icons.verified_outlined),
                        suffixText: '发送验证码',
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],
                  TextField(
                    controller: password,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: '账号密码',
                      prefixIcon: Icon(Icons.lock_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 22),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: pine,
                      minimumSize: const Size.fromHeight(54),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: () => setState(() => loggedIn = true),
                    child: Text(register ? '注册并进入拾光' : '登录并进入拾光'),
                  ),
                  TextButton(
                    onPressed: () => setState(() => register = !register),
                    child: Text(register ? '已经有账户？返回登录' : '还没有账户？创建新账户'),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    '测试账号：13800138000  ·  密码：Shiguang2026!',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.black45),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class BrandMark extends StatelessWidget {
  const BrandMark({super.key});
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 48,
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: ink,
          borderRadius: BorderRadius.circular(15),
        ),
        child: const Text(
          '拾',
          style: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      const SizedBox(width: 12),
      const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '拾光',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 20,
              color: ink,
            ),
          ),
          Text(
            'PRIVATE GROWTH ARCHIVE',
            style: TextStyle(
              fontSize: 9,
              letterSpacing: 1.2,
              color: Colors.black45,
            ),
          ),
        ],
      ),
    ],
  );
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;
  bool mobileSidebarExpanded = false;
  final pages = const [
    StoryPage(),
    RecordsPage(),
    PortraitPage(),
    PartnersPage(),
  ];
  final destinations = const [
    NavigationDestination(
      icon: Icon(Icons.auto_awesome_outlined),
      selectedIcon: Icon(Icons.auto_awesome),
      label: '我的故事',
    ),
    NavigationDestination(
      icon: Icon(Icons.calendar_month_outlined),
      selectedIcon: Icon(Icons.calendar_month),
      label: '我的记录',
    ),
    NavigationDestination(
      icon: Icon(Icons.bubble_chart_outlined),
      selectedIcon: Icon(Icons.bubble_chart),
      label: '我的画像',
    ),
    NavigationDestination(
      icon: Icon(Icons.people_outline_rounded),
      selectedIcon: Icon(Icons.people_rounded),
      label: '同路人',
    ),
  ];
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) {
      final desktop = box.maxWidth >= 800,
          body = IndexedStack(index: index, children: pages);
      if (!desktop) {
        return Scaffold(
          body: Stack(
            children: [
              Padding(padding: const EdgeInsets.only(left: 72), child: body),
              if (mobileSidebarExpanded)
                Positioned.fill(
                  left: 232,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => setState(() => mobileSidebarExpanded = false),
                  ),
                ),
              Align(
                alignment: Alignment.centerLeft,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 240),
                  curve: Curves.easeOutCubic,
                  width: mobileSidebarExpanded ? 232 : 72,
                  decoration: const BoxDecoration(
                    color: mist,
                    border: Border(right: BorderSide(color: line)),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x14000000),
                        blurRadius: 18,
                        offset: Offset(4, 0),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Column(
                      children: [
                        const SizedBox(height: 10),
                        IconButton(
                          tooltip: mobileSidebarExpanded ? '收起侧边栏' : '展开侧边栏',
                          onPressed: () => setState(
                            () =>
                                mobileSidebarExpanded = !mobileSidebarExpanded,
                          ),
                          icon: Icon(
                            mobileSidebarExpanded
                                ? Icons.menu_open_rounded
                                : Icons.menu_rounded,
                          ),
                        ),
                        const SizedBox(height: 18),
                        ...List.generate(
                          destinations.length,
                          (i) => Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            child: Material(
                              color: index == i
                                  ? Colors.white
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(14),
                                onTap: () => setState(() {
                                  index = i;
                                  mobileSidebarExpanded = false;
                                }),
                                child: SizedBox(
                                  height: 52,
                                  child: Row(
                                    children: [
                                      SizedBox(
                                        width: 54,
                                        child: IconTheme(
                                          data: IconThemeData(
                                            color: index == i ? pine : ink,
                                          ),
                                          child: index == i
                                              ? destinations[i].selectedIcon ??
                                                    destinations[i].icon
                                              : destinations[i].icon,
                                        ),
                                      ),
                                      if (mobileSidebarExpanded)
                                        Expanded(
                                          child: Text(
                                            destinations[i].label,
                                            maxLines: 1,
                                            style: TextStyle(
                                              color: index == i ? pine : ink,
                                              fontWeight: index == i
                                                  ? FontWeight.w700
                                                  : FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const Spacer(),
                        if (mobileSidebarExpanded)
                          const Padding(
                            padding: EdgeInsets.all(18),
                            child: Text(
                              '林溪 · 仅自己可见',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.black45,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }
      return Scaffold(
        body: Row(
          children: [
            Container(
              width: 250,
              decoration: const BoxDecoration(
                color: mist,
                border: Border(right: BorderSide(color: line)),
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(24),
                      child: BrandMark(),
                    ),
                    const SizedBox(height: 16),
                    ...List.generate(
                      destinations.length,
                      (i) => Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 4,
                        ),
                        child: ListTile(
                          leading: destinations[i].icon,
                          title: Text(destinations[i].label),
                          selected: index == i,
                          selectedColor: ink,
                          selectedTileColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          onTap: () => setState(() => index = i),
                        ),
                      ),
                    ),
                    const Spacer(),
                    const Padding(
                      padding: EdgeInsets.all(22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Divider(),
                          Text(
                            '林溪 · 仅自己可见',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.black45,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            '每天 21:30 生成成长卡片',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.black45,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(child: body),
          ],
        ),
      );
    },
  );
}

class PageFrame extends StatelessWidget {
  final String eyebrow, title, subtitle;
  final List<Widget> children;
  const PageFrame({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.children,
  });
  @override
  Widget build(BuildContext context) => SafeArea(
    child: CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 22, 22, 12),
          sliver: SliverToBoxAdapter(
            child: Row(
              children: [
                const Expanded(child: BrandMark()),
                IconButton(
                  onPressed: () =>
                      openDetail(context, '隐私与记忆', const PrivacyContent()),
                  icon: const Icon(Icons.shield_outlined),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 18),
          sliver: SliverToBoxAdapter(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 900),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    eyebrow,
                    style: const TextStyle(
                      fontSize: 10,
                      letterSpacing: 1.7,
                      color: pine,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(title, style: Theme.of(context).textTheme.headlineLarge),
                  const SizedBox(height: 8),
                  Text(subtitle),
                ],
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 4, 22, 40),
          sliver: SliverList(delegate: SliverChildListDelegate(children)),
        ),
      ],
    ),
  );
}

class StoryPage extends StatefulWidget {
  const StoryPage({super.key});
  @override
  State<StoryPage> createState() => _StoryPageState();
}

class _StoryPageState extends State<StoryPage> {
  final input = TextEditingController();
  final messages = [
    '晚上好，林溪。今天有没有一件很小、但让你觉得“这是我做出来的”的事情？',
    '我把阳台重新整理了一下，还给每盆植物做了标签。',
    '这不只是整理。你在观察植物的需要，也建立了一套自己的分类方法。你最满意哪个决定？',
  ];
  @override
  Widget build(BuildContext context) => PageFrame(
    eyebrow: 'A QUIET PLACE FOR YOUR THOUGHTS',
    title: '今天，想从哪里开始说起？',
    subtitle: '从一个画面、一点情绪，或者今天刚刚发生的小事开始。',
    children: [
      const SizedBox(height: 12),
      ...List.generate(
        messages.length,
        (i) => Align(
          alignment: i == 1 ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            constraints: const BoxConstraints(maxWidth: 620),
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: i == 1 ? pine : Colors.white,
              border: Border.all(color: line),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Text(
              messages[i],
              style: TextStyle(
                color: i == 1 ? Colors.white : ink,
                fontSize: 15,
                height: 1.55,
              ),
            ),
          ),
        ),
      ),
      const SizedBox(height: 10),
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: line),
        ),
        child: Row(
          children: [
            IconButton(
              onPressed: () => showDialog(
                context: context,
                builder: (_) => const PermissionDialog(),
              ),
              icon: const Icon(Icons.camera_alt_outlined),
            ),
            Expanded(
              child: TextField(
                controller: input,
                decoration: const InputDecoration(
                  hintText: '输入你的想法…',
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  filled: false,
                ),
              ),
            ),
            IconButton.filled(
              onPressed: () {
                if (input.text.trim().isNotEmpty) {
                  setState(() {
                    messages.add(input.text.trim());
                    input.clear();
                  });
                }
              },
              icon: const Icon(Icons.arrow_upward_rounded),
            ),
          ],
        ),
      ),
      const SizedBox(height: 14),
      OutlinedButton.icon(
        onPressed: () => openDetail(context, '本次成长卡片', const CardDetail()),
        icon: const Icon(Icons.auto_awesome),
        label: const Text('整理这次对话'),
      ),
    ],
  );
}

class RecordsPage extends StatelessWidget {
  const RecordsPage({super.key});
  @override
  Widget build(BuildContext context) => PageFrame(
    eyebrow: 'GROWTH CALENDAR',
    title: '我的记录',
    subtitle: '有记录的日子会被轻轻标出，点击卡片可查看能力证据。',
    children: [
      const SizedBox(height: 14),
      SizedBox(
        height: 230,
        child: ListView(
          scrollDirection: Axis.horizontal,
          children: [
            RecordCard(
              title: '让杂乱重新有秩序',
              date: '08.19',
              onTap: () => openDetail(context, '成长卡片', const CardDetail()),
            ),
            RecordCard(
              title: '我其实很会照顾细节',
              date: '08.12',
              onTap: () => openDetail(context, '成长卡片', const CardDetail()),
            ),
          ],
        ),
      ),
      const SizedBox(height: 24),
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '2026 年 8 月',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                const Icon(Icons.chevron_left, size: 20),
                const Text('月历'),
                const Icon(Icons.chevron_right, size: 20),
              ],
            ),
            const SizedBox(height: 22),
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Text('日'),
                Text('一'),
                Text('二'),
                Text('三'),
                Text('四'),
                Text('五'),
                Text('六'),
              ],
            ),
            const SizedBox(height: 10),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 37,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
              ),
              itemBuilder: (_, i) {
                final day = i - 5, marked = [3, 12, 19, 27].contains(day);
                return Container(
                  margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: marked ? const Color(0xFFE7F1EB) : null,
                    borderRadius: BorderRadius.circular(9),
                  ),
                  alignment: Alignment.center,
                  child: day > 0 && day <= 31
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('$day'),
                            if (marked)
                              const Icon(Icons.circle, size: 6, color: pine),
                          ],
                        )
                      : null,
                );
              },
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      FilledButton.icon(
        onPressed: () => openDetail(context, '八月月度总结', const MonthlyDetail()),
        icon: const Icon(Icons.auto_graph),
        label: const Text('查看月度总结'),
      ),
    ],
  );
}

class RecordCard extends StatelessWidget {
  final String title, date;
  final VoidCallback onTap;
  const RecordCard({
    super.key,
    required this.title,
    required this.date,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 270,
      margin: const EdgeInsets.only(right: 14),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(24)),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/images/botanical-journal.png', fit: BoxFit.cover),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Color(0xCC13231D)],
              ),
            ),
          ),
          Positioned(
            left: 18,
            right: 18,
            bottom: 18,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(date, style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 6),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class PortraitPage extends StatelessWidget {
  const PortraitPage({super.key});
  @override
  Widget build(BuildContext context) {
    final skills = [
      '观察力',
      '整理',
      '持续照护',
      '审美判断',
      '经验表达',
      '分类能力',
      '耐心',
      '共情',
      '空间感',
      '问题拆解',
    ];
    return PageFrame(
      eyebrow: 'MY PORTRAIT · 24 SIGNALS',
      title: '我的画像',
      subtitle: '由你的对话、行动记录和真实选择慢慢形成。每一条判断都可以回到具体证据。',
      children: [
        const SizedBox(height: 20),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('已发现的能力线索', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: skills
                    .map(
                      (s) => ActionChip(
                        label: Text(s),
                        avatar: const Icon(Icons.circle, size: 8, color: pine),
                        onPressed: () => openDetail(
                          context,
                          '$s观察说明书',
                          SkillDetail(skill: s),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        MenuCard(
          icon: Icons.menu_book_outlined,
          title: '全部能力词库',
          subtitle: '查看能力分类与成长证据',
          onTap: () => openDetail(context, '全部能力词库', const VocabularyDetail()),
        ),
        MenuCard(
          icon: Icons.auto_stories_outlined,
          title: '个人档案与记忆',
          subtitle: '23 条记录',
          onTap: () => openDetail(context, '个人档案与记忆', const MemoryDetail()),
        ),
        MenuCard(
          icon: Icons.shield_outlined,
          title: '数据与摄像头权限',
          subtitle: '由你控制',
          onTap: () => openDetail(context, '隐私与摄像头权限', const PrivacyContent()),
        ),
        MenuCard(
          icon: Icons.ios_share_outlined,
          title: '导出我的内容',
          subtitle: '生成个人数据副本',
          onTap: () => openDetail(context, '导出我的内容', const ExportDetail()),
        ),
      ],
    );
  }
}

class PartnersPage extends StatelessWidget {
  const PartnersPage({super.key});
  @override
  Widget build(BuildContext context) => PageFrame(
    eyebrow: 'MY SOCIAL FIELD',
    title: '我的同路人',
    subtitle: '从兴趣与能力出发，发现可以一起尝试小项目的人。',
    children: [
      const SizedBox(height: 18),
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: pine,
                  child: Text(
                    '林',
                    style: TextStyle(color: Colors.white, fontSize: 22),
                  ),
                ),
                const SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('林溪', style: Theme.of(context).textTheme.titleLarge),
                    const Text('上海 · 可线上交流'),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 18),
            const Text(
              '感兴趣',
              style: TextStyle(color: pine, fontWeight: FontWeight.bold),
            ),
            const Text('社区分享与新手陪伴'),
            const SizedBox(height: 12),
            const Text(
              '擅长',
              style: TextStyle(color: pine, fontWeight: FontWeight.bold),
            ),
            const Text('观察细节、分类整理、持续照护'),
          ],
        ),
      ),
      const SizedBox(height: 18),
      FilledButton.icon(
        onPressed: () =>
            openDetail(context, '可探索的方向', const OpportunityDetail()),
        icon: const Icon(Icons.explore_outlined),
        label: const Text('查看探索方向'),
      ),
      const SizedBox(height: 18),
      ...['周宁 · 内容运营 · 92%', '阿禾 · 社区组织 · 86%', 'Mia · 摄影记录 · 78%'].map(
        (p) => MenuCard(
          icon: Icons.person_outline,
          title: p,
          subtitle: '查看合作设想并开始交流',
          onTap: () => openDetail(
            context,
            '伙伴空间',
            PartnerDetail(name: p.split(' · ').first),
          ),
        ),
      ),
    ],
  );
}

class AppCard extends StatelessWidget {
  final Widget child;
  const AppCard({super.key, required this.child});
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: line),
      boxShadow: const [
        BoxShadow(
          color: Color(0x09000000),
          blurRadius: 20,
          offset: Offset(0, 8),
        ),
      ],
    ),
    child: child,
  );
}

class MenuCard extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;
  const MenuCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: ListTile(
      tileColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: line),
      ),
      leading: Icon(icon, color: pine),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    ),
  );
}

void openDetail(BuildContext context, String title, Widget child) =>
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DetailScaffold(title: title, child: child),
      ),
    );

class DetailScaffold extends StatelessWidget {
  final String title;
  final Widget child;
  const DetailScaffold({super.key, required this.title, required this.child});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(title),
      backgroundColor: paper,
      surfaceTintColor: Colors.transparent,
    ),
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 850),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(22),
            child: child,
          ),
        ),
      ),
    ),
  );
}

class CardDetail extends StatelessWidget {
  const CardDetail({super.key});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Image.asset(
          'assets/images/botanical-journal.png',
          height: 230,
          width: double.infinity,
          fit: BoxFit.cover,
        ),
      ),
      const SizedBox(height: 22),
      Text('让杂乱重新有秩序', style: Theme.of(context).textTheme.headlineLarge),
      const SizedBox(height: 12),
      const Text('你没有简单地“收拾阳台”，而是观察、分类，并为植物建立了一套容易继续维护的秩序。'),
      const SizedBox(height: 18),
      const AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '能力证据',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            SizedBox(height: 12),
            Text('01  观察：发现不同植物需要不同照护'),
            Text('02  建立规则：制作标签并重新分类'),
            Text('03  形成结果：空间更容易持续维护'),
          ],
        ),
      ),
    ],
  );
}

class MonthlyDetail extends StatelessWidget {
  const MonthlyDetail({super.key});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        '你正在把“照顾”变成一种创造力。',
        style: Theme.of(context).textTheme.headlineLarge,
      ),
      const SizedBox(height: 14),
      const Text('八月，你持续通过观察、分类与记录，让复杂的日常变得更容易理解。'),
      const SizedBox(height: 24),
      const ProgressLine(label: '观察与发现', value: .86),
      const ProgressLine(label: '整理与行动', value: .72),
      const ProgressLine(label: '表达与分享', value: .43),
      const SizedBox(height: 20),
      const AppCard(
        child: Text('下个月可以继续留意：当你把照顾经验讲给别人听时，“整理”可能会进一步转化成教学和内容表达。'),
      ),
    ],
  );
}

class ProgressLine extends StatelessWidget {
  final String label;
  final double value;
  const ProgressLine({super.key, required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 10),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(label)),
            Text('${(value * 100).round()}%'),
          ],
        ),
        const SizedBox(height: 7),
        LinearProgressIndicator(
          value: value,
          minHeight: 8,
          borderRadius: BorderRadius.circular(8),
          color: pine,
          backgroundColor: line,
        ),
      ],
    ),
  );
}

class SkillDetail extends StatelessWidget {
  final String skill;
  const SkillDetail({super.key, required this.skill});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(skill, style: Theme.of(context).textTheme.headlineLarge),
      const SizedBox(height: 12),
      const Text('你常常先注意到具体差异，再决定怎样整理和行动。这项能力来自多次真实对话与行动记录。'),
      const SizedBox(height: 20),
      const AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('观察证据', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('• 为每盆植物制作不同标签'),
            Text('• 发现光照与浇水频率的差异'),
            Text('• 把零散经验整理成可复用的方法'),
          ],
        ),
      ),
    ],
  );
}

class VocabularyDetail extends StatelessWidget {
  const VocabularyDetail({super.key});
  @override
  Widget build(BuildContext context) {
    final groups = {
      '感知': ['观察力', '敏感度', '空间感'],
      '组织': ['整理', '分类能力', '问题拆解'],
      '关系': ['共情', '持续照护', '合作意识'],
      '创造': ['审美判断', '经验表达', '内容创作'],
    };
    return Column(
      children: groups.entries
          .map(
            (e) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(e.key, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: e.value
                          .map((x) => Chip(label: Text(x)))
                          .toList(),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class MemoryDetail extends StatelessWidget {
  const MemoryDetail({super.key});
  @override
  Widget build(BuildContext context) => Column(
    children: ['第一次把经验教给别人', '我其实很会照顾细节', '让杂乱重新有秩序', '今天的成长片段']
        .map(
          (x) => MenuCard(
            icon: Icons.bookmark_border,
            title: x,
            subtitle: '来自当日对话 · 可随时删除',
            onTap: () => openDetail(context, '成长卡片', const CardDetail()),
          ),
        )
        .toList(),
  );
}

class PrivacyContent extends StatelessWidget {
  const PrivacyContent({super.key});
  @override
  Widget build(BuildContext context) => Column(
    children: const [
      AppCard(
        child: ListTile(
          leading: Icon(Icons.camera_alt_outlined),
          title: Text('摄像头与表情辅助'),
          subtitle: Text('默认关闭，仅在你主动允许后使用'),
          trailing: Switch(value: false, onChanged: null),
        ),
      ),
      SizedBox(height: 14),
      AppCard(
        child: ListTile(
          leading: Icon(Icons.memory_outlined),
          title: Text('长期记忆'),
          subtitle: Text('你可以查看、更正或删除任何记录'),
          trailing: Switch(value: true, onChanged: null),
        ),
      ),
      SizedBox(height: 14),
      AppCard(
        child: ListTile(
          leading: Icon(Icons.lock_outline),
          title: Text('个人资料'),
          subtitle: Text('默认仅自己可见'),
        ),
      ),
    ],
  );
}

class ExportDetail extends StatelessWidget {
  const ExportDetail({super.key});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const Icon(Icons.file_download_outlined, size: 64, color: pine),
      const SizedBox(height: 18),
      Text(
        '导出我的内容',
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const SizedBox(height: 12),
      const Text('包括对话、成长卡片、能力证据、月度报告和个人资料。', textAlign: TextAlign.center),
      const SizedBox(height: 24),
      FilledButton.icon(
        onPressed: () {},
        icon: const Icon(Icons.archive_outlined),
        label: const Text('生成数据副本'),
      ),
    ],
  );
}

class OpportunityDetail extends StatelessWidget {
  const OpportunityDetail({super.key});
  @override
  Widget build(BuildContext context) => Column(
    children: ['植物照护 × 内容记录', '社区植物互助', '新手七日陪伴']
        .map(
          (x) => MenuCard(
            icon: Icons.explore_outlined,
            title: x,
            subtitle: '结合你的兴趣与已发现能力',
            onTap: () => openDetail(context, '同好伙伴推荐', const PartnersPage()),
          ),
        )
        .toList(),
  );
}

class PartnerDetail extends StatelessWidget {
  final String name;
  const PartnerDetail({super.key, required this.name});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      CircleAvatar(
        radius: 42,
        backgroundColor: pine,
        child: Text(
          name.substring(0, 1),
          style: const TextStyle(color: Colors.white, fontSize: 28),
        ),
      ),
      const SizedBox(height: 14),
      Text(
        name,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const SizedBox(height: 20),
      const AppCard(
        child: Text('我很想和你一起试做一个「阳台植物新手手册」。我们可以先把目标、分工和第一周的小成果写清楚。'),
      ),
      const SizedBox(height: 16),
      const TextField(
        maxLines: 3,
        decoration: InputDecoration(hintText: '输入想说的话…'),
      ),
      const SizedBox(height: 10),
      FilledButton(onPressed: () {}, child: const Text('发送消息')),
    ],
  );
}

class PermissionDialog extends StatelessWidget {
  const PermissionDialog({super.key});
  @override
  Widget build(BuildContext context) => AlertDialog(
    icon: const Icon(Icons.camera_alt_outlined, color: pine, size: 36),
    title: const Text('开启表情辅助？'),
    content: const Text('仅在本次对话中分析表情信号。原始画面不会被保存或上传，你可以随时关闭。'),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('暂不开启'),
      ),
      FilledButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('允许本次使用'),
      ),
    ],
  );
}
