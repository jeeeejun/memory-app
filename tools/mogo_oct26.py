# 2026년 10월 고1 모의고사 영어 지문 → mogo.html 의 <script id="mogo-data"> 를 채운다.
# 기준: 사용자가 보낸 시험지 사진(2·3·5·6·7쪽 = 18~24번, 29~40번) 원문을 보고 정리. 41~45번은 사진이 없어 아직 없음.
# 지문 전체를 옮기지 않는다: 내 말로 정리한 구조 + 지문 속 짧은 핵심 표현(en)만.
# 정답은 공식 정답표가 아니라 시험지의 채점 표시 + 지문 내용으로 확인한 것.
# 형식: P(번호, 유형, 정답, 주제, 가운데, [(가지, [(내용, 표현)...])...], [(단계, 내용, 표현)...], 요약, 풀이 메모)
import json, os, re
D = []
def P(id, type, answer, topic, center, branches, flow, summary, note=""):
    assert 3 <= len(branches) <= 5 and 4 <= len(flow) <= 6, id
    D.append({"id": id, "type": type, "answer": answer, "topic": topic,
              "map": {"center": center, "branches": [{"label": l, "items": [{"ko": k, "en": e} for k, e in its]} for l, its in branches]},
              "flow": [{"tag": t, "ko": k, "en": e} for t, k, e in flow], "summary": summary, **({"note": note} if note else {})})

P("18", "글의 목적", "①", "업무 관련 연수 비용 지원을 요청하는 편지", "연수 비용 지원 요청 편지", [
 ("누가 누구에게", [("마케팅 부서의 마케팅 보조 Karen Whitfield", "a marketing assistant in the marketing department"), ("Ms. Palmer에게 쓰는 편지", "Dear Ms. Palmer")]),
 ("왜 (배경)", [("부서에 더 기여하려고 추가 연수를 받고 싶음", "receive additional training"), ("역량을 더 키우려고", "further develop my skills"), ("지난 분기: 온라인 잠재 고객을 더 끌어야 함을 알게 됨", "better attract potential customers")]),
 ("요청 (핵심)", [("연수 비용 일부를 회사가 부담해 주길", "cover part of my training cost"), ("긍정적으로 검토해 주길", "consider my request positively")]),
 ("찾아 둔 과정", [("Smart Growth Training의 2주 과정", "two-week course"), ("디지털 마케팅 전략 중심", "focuses on digital marketing strategies"), ("1,600달러, 현재 업무에 도움이 될 것", "I strongly believe it would be helpful")]),
], [
 ("자기소개", "마케팅 부서의 마케팅 보조 Karen Whitfield입니다", "a marketing assistant in the marketing department"),
 ("바람", "부서에 더 기여하려고 추가 연수로 역량을 키우고 싶다", "As part of my efforts to contribute more"),
 ("이유", "지난 분기, 온라인에서 잠재 고객을 더 잘 끌어야 한다는 걸 알게 됐다", "Over the last quarter, I noticed ..."),
 ("요청", "그래서 연수 비용 일부를 회사가 부담해 주길 요청한다", "For this reason, I'm requesting ..."),
 ("구체 내용", "디지털 마케팅 전략 2주 과정, 1,600달러 — 업무에 도움이 될 것", "focuses on digital marketing strategies"),
 ("마무리", "요청을 긍정적으로 검토해 주길 바란다", "consider my request positively"),
], "마케팅 보조 Karen이 온라인 고객 유치 역량을 키우려고 디지털 마케팅 연수를 받고 싶다며, 그 비용 일부를 회사가 지원해 달라고 요청하는 편지.")

P("19", "심경 변화", "① excited → disappointed", "방학 전날, 들뜸이 실망으로 바뀌다", "방학 전날: 신남 → 실망", [
 ("상황", [("여름 방학 전 마지막 등교일", "the last day of school before summer vacation"), ("몇 달간의 퀴즈와 과제가 끝남", "months of quizzes and assignments")]),
 ("신남 (excited)", [("다 뒤로하고 떠나고 싶어 못 견딤", "couldn't wait to leave everything behind"), ("사물함을 치우며 춤추다시피 함", "practically danced"), ("아무것도 기분을 망칠 수 없음", "nothing could ruin my mood")]),
 ("반전", [("과학 선생님 Mr. Manta가 따로 부름", "called me aside"), ("기말 실험 보고서를 내지 않았음", "haven't turned in your final lab report"), ("그 말이 찬물처럼 충격", "hit me like cold water")]),
 ("실망 (disappointed)", [("보충하려면 여름 학교에 나와야 함", "To make up for it, you must attend summer school"), ("방학을 실험대에서 보내게 됨", "at a lab table"), ("소중한 여름에 가장 하기 싫던 일", "the last thing I wanted to do")]),
], [
 ("배경", "여름 방학 전 마지막 등교일", "the last day of school before summer vacation"),
 ("기대", "다 뒤로하고 떠날 생각에 들떠 사물함을 치우며 춤추다시피 했다", "I couldn't wait to leave everything behind"),
 ("사건", "가방을 메고 나가려는데 과학 선생님이 따로 불렀다", "called me aside"),
 ("충격", "기말 실험 보고서를 안 냈다는 말이 찬물처럼 덮쳤다", "The words hit me like cold water"),
 ("결과", "보충하려면 여름 학교에 나와야 한다", "To make up for it, you must attend summer school"),
 ("심경", "소중한 여름을 실험대에서 — 가장 하기 싫던 일", "the last thing I wanted to do"),
], "방학을 앞두고 들떠 있던 '나'가, 실험 보고서를 내지 않아 여름 학교에 나와야 한다는 말을 듣고 실망한다.")

P("20", "필자의 주장", "⑤", "세계인의 연결과 공통 과제를 고려해 세계 시민 정체성을 더해야 한다", "세계 시민 정체성을 더해야 한다", [
 ("주장", [("스스로를 세계 시민으로 생각하는 것은 필요하고 가능하다", "both necessary and possible"), ("세계 시민 의식", "global citizenship")]),
 ("회의론과 반박", [("일부는 세계 시민 의식에 회의적", "skeptical about"), ("인류 역사 대부분, 국민 국가의 시민이라고 생각하지도 않았음", "citizens of nation-states"), ("국민 국가 자체가 없었으니까", "nation-states didn't exist")]),
 ("정체성은 더해져 왔다", [("지난 몇 세기 국민 국가의 등장", "The rise of nation-states"), ("가족·민족·종교 같은 정체성에 국가 시민 의식을 더함", "add state citizenship to other identities")]),
 ("그래서 지금", [("세계인의 연결과 우리가 마주한 공통 과제", "the common challenges we face"), ("세계 시민 의식을 다른 정체성 위에 덧입혀야", "layer global citizenship on to these other identities")]),
 ("오해 금지", [("다른 정체성을 대체한다는 뜻이 아님", "replaces these other identities"), ("정체성 이야기는 하나가 아님", "not a single story"), ("가족·공동체·세계 모두에 의무가 있기 때문", "we have obligations")]),
], [
 ("주장", "스스로를 세계 시민으로 생각하는 것은 필요하고 가능하다", "both necessary and possible"),
 ("반론", "일부는 세계 시민 의식이라는 생각에 회의적이다", "Some people are skeptical about ..."),
 ("반박", "하지만 인류 역사 대부분, 국민 국가의 시민이라고 생각하지도 않았다 — 국민 국가가 없었다", "After all, ... nation-states didn't exist."),
 ("근거", "국민 국가가 등장하면서 기존 정체성에 국가 시민 의식을 더했다", "The rise of nation-states ..."),
 ("결론", "세계의 연결과 공통 과제를 생각하면 세계 시민 의식도 덧입혀야 한다", "Given the connections ..., we need to layer global citizenship on"),
 ("보충", "대체가 아니다 — 가족, 공동체, 세계 모두에 의무가 있기 때문이다", "This doesn't mean that ... replaces"),
], "국민 국가 시민 의식도 나중에 더해진 정체성이듯, 세계가 연결되고 공통 과제를 마주한 지금은 기존 정체성을 버리지 않고 그 위에 세계 시민 정체성을 더해야 한다.")

P("21", "함축 의미", "①", "불만족한 직장인의 소용없는 노력", "타이타닉의 갑판 의자 다시 놓기 = 소용없는 노력", [
 ("불만족한 직장인의 믿음", [("되풀이되는 주제", "a repeating theme"), ("언젠가 상황이 기적처럼 바뀔 것", "miraculously change"), ("완벽한 직업을 우연히 만날 것", "stumble into the perfect job")]),
 ("실제 행동", [("현재 상황을 의미 있게 바꾸는 일은 거의 안 함", "do little to meaningfully alter"), ("채용 게시판에서 비슷한 직함의 자리를 찾음", "roles with a similar job title"), ("다른 부서·회사에서 새로 고침만 누르면 마법이 뿌려지길 기대", "hit the refresh button")]),
 ("결과", [("뭔가 하고 있다는 기분만 듦", "feel like they are doing something"), ("새 자리에서도 금세 전처럼 환상이 깨짐", "just as disenchanted as they were before")]),
 ("필자의 조언", [("접근법을 완전히 바꿔라", "completely switch up your approach"), ("같은 게임을 하면 같은 상을 받는다", "you'll win the same prizes")]),
], [
 ("현상", "불만족한 직장인들은 언젠가 기적처럼 완벽한 직업을 만날 거라고 믿는다", "a repeating theme"),
 ("문제", "그러면서 현재 상황을 의미 있게 바꾸는 일은 거의 하지 않는다", "At the same time, they do little to ..."),
 ("행동", "채용 게시판에서 비슷한 직함만 찾으며 마법이 일어나길 바란다", "hit the refresh button"),
 ("결과", "뭔가 하는 기분만 들 뿐, 새 자리에서도 똑같이 환상이 깨진다", "just as disenchanted as they were before"),
 ("비유", "타이타닉에서 갑판 의자를 다시 놓는 것과 같다", "rearranging deck chairs on the Titanic"),
 ("조언", "접근법을 완전히 바꿔라 — 같은 게임이면 같은 상", "completely switch up your approach"),
], "불만족한 직장인이 방식은 그대로 둔 채 비슷한 자리로 옮기기만 하는 것은, 가라앉는 타이타닉에서 의자 배치를 바꾸는 것처럼 소용없다. 접근법 자체를 바꿔야 한다.")

P("22", "요지", "⑤", "시간을 인식하고 사용하는 방식은 사회적인 산물이다", "시간의 인식·사용 = 사회적 산물", [
 ("아닌 것", [("자연의 기본 속성이 아님", "basic properties of nature"), ("개인 경험의 심리 현상만도 아님", "psychological phenomena")]),
 ("사회학자의 주장", [("전통과 문화 규범이 형성함", "shaped by tradition and cultural norms"), ("상당한 정도로", "to a large degree")]),
 ("근거 (Zerubavel)", [("일주일 = 시간의 기본 단위", "a fundamental unit of time"), ("사회적 발명품", "a social invention"), ("문화마다 다름", "varies across cultures")]),
 ("예시 질문", [("9시~5시 근무", "nine-to-five job routine"), ("월말에 요금 납부", "pay our bills at the end of the month"), ("정년 65세", "the retirement age")]),
 ("결론", [("자연이나 인간 본질이 정한 것이 아님", "dictated by nature"), ("내면화해서 '정상'으로 받아들인 사회적 창조물", "social creations that we internalize")]),
], [
 ("부정", "시간의 인식과 사용은 자연의 속성도, 개인의 심리 현상도 아니다", "not just basic properties of nature"),
 ("주장", "대신 전통과 문화 규범이 상당 부분 형성한다", "Instead, ... shaped by tradition and cultural norms"),
 ("근거", "Zerubavel — 일주일은 문화마다 다른 사회적 발명품이다", "a social invention that varies across cultures"),
 ("예시", "9시~5시 근무, 주말 휴무, 월말 납부, 정년 65세", "Why is the retirement age sixty-five?"),
 ("결론", "자연이 정한 것이 아니라 우리가 내면화해 '정상'이라 받아들인 사회적 창조물이다", "social creations that we internalize"),
], "시간을 느끼고 쓰는 방식은 자연법칙이나 개인 심리가 아니라 전통과 문화가 만든 것이다. 일주일, 근무 시간, 정년 같은 것도 사회가 만들어 우리가 당연하게 받아들인 것이다.")

P("23", "주제", "⑤", "내부 고발자의 행동과 공익을 지키기 위한 보호의 필요성", "내부 고발자 보호의 필요성", [
 ("배경", [("기업 차원의 불법 행위가 늘어남", "illegal actions ... at the corporate level"), ("적어도 드러난 사례가 늘어남", "came to light")]),
 ("내부 고발자", [("용감한 제보자가 큰 위험을 감수", "risked a great deal"), ("그 덕분에 비리가 드러남", "been exposed"), ("그래서 보호가 주목받음", "come into focus")]),
 ("보호가 없으면", [("보복이 두려워 신고하지 못함", "for fear of reprisals"), ("위반이 몇 년씩 발각·처벌되지 않음", "go undetected and unpunished"), ("회사·제3자·경제·대중·법치까지 피해", "the rule of law")]),
 ("보호의 두 기능", [("개인의 행동을 보호", "Protecting the individual's actions"), ("공익을 보호", "protecting the public good"), ("균형 잡힌 보호는 둘 다에 긍정적", "well-balanced")]),
], [
 ("배경", "최근 기업 차원의 불법 행위(적어도 드러난 사례)가 늘었다", "In recent years, ..."),
 ("사실", "그런 비리는 용감한 제보자가 큰 위험을 감수했기에 드러났다", "brave informants have risked a great deal"),
 ("그래서", "내부 고발자 보호가 주목받는 것은 당연하다", "Hence, ... come into focus"),
 ("가정", "보복이 두려워 신고하지 못하면 위반이 몇 년씩 묻힌다", "go undetected and unpunished"),
 ("피해", "회사, 제3자, 경제, 대중, 법치까지 해를 입는다", "even the rule of law could be affected"),
 ("결론", "보호는 개인의 행동과 공익을 함께 지킨다", "as well as protecting the public good"),
], "기업 비리는 내부 고발자가 위험을 감수해야 드러난다. 신고를 두려워하면 피해가 사회 전체로 퍼지므로, 고발자 개인과 공익을 함께 지키는 균형 잡힌 보호가 필요하다.")

P("24", "제목", "④ Fantasizing About the Future: A Barrier to Action", "미래에 대한 환상은 행동을 막는다", "미래에 대한 환상 = 행동의 걸림돌", [
 ("문제", [("목표라는 생각이 일상의 현실과 동떨어짐", "disconnected from the daily reality"), ("목표라는 '생각'과 사랑에 빠짐", "fall in love with the idea of a goal"), ("일상이 얼마나 달라져야 하는지 잊음", "pushing out of mind")]),
 ("연구", [("긍정적 환상 → 노력을 덜 하게 됨", "put less effort into our goals"), ("거짓되고 섣부른 성취감", "a false and premature sense of accomplishment")]),
 ("낭만화", [("목표를 낭만화함", "romanticize a goal"), ("복잡함과 어려움을 얼버무림", "gloss over the intricacies and challenges"), ("새 행동을 삶에 통합하는 일", "integrating a complex new behavior into our life")]),
 ("한 연구의 정리", [("바라는 미래를 지금 머릿속으로 즐기도록 유혹", "seduces a person to mentally enjoy"), ("왜 아직 현실이 아닌지 돌아보지 않음", "reflect on"), ("행동할 필요가 생기지 않음", "a necessity to act is not induced")]),
], [
 ("문제 제기", "목표라는 생각은 그것을 이루는 일상의 현실과 동떨어질 때가 있다", "disconnected from the daily reality"),
 ("설명", "목표의 '생각'에 빠져, 일상이 얼마나 달라져야 하는지 잊는다", "pushing out of mind"),
 ("연구", "긍정적 환상은 섣부른 성취감을 줘서 노력을 덜 하게 만든다", "In fact, research even suggests ..."),
 ("과정", "목표를 낭만화하며 새 행동을 삶에 넣는 복잡함을 얼버무린다", "gloss over the intricacies and challenges"),
 ("결론", "미래를 지금 머릿속으로 즐기게 되어 행동할 필요가 생기지 않는다", "a necessity to act is not induced"),
], "목표를 이룬 미래를 상상하며 즐기면 이미 이룬 듯한 성취감이 생겨, 정작 필요한 노력과 행동을 덜 하게 된다.")

P("29", "어법", "②", "'불멸' 생물 연구를 인간 노화에 바로 쓰기는 어렵다", "'불멸' 생물 연구, 인간에게 바로 쓰긴 어렵다", [
 ("생물학적 불멸", [("히드라와 불멸의 해파리", "hydra and the immortal jellyfish"), ("뚜렷한 노화 징후가 없음", "don't exhibit obvious signs of aging"), ("죽지 않는 게 아니라, 나이 들어도 죽을 확률이 늘지 않음", "their likelihood of dying does not increase with age")]),
 ("기대", [("노화학자들을 들뜨게 함", "excite gerontologists"), ("노화를 이길 단서", "clues about how to defeat the aging process")]),
 ("한계", [("몸 전체를 재생하는 특성", "regenerate entire body parts"), ("우리보다 나무에 더 가까움", "more similar to trees than to us"), ("인간 노화와 얼마나 관련 있을지 불분명", "how relevant those findings will be")]),
 ("결론", [("근본 기제라면 생물학은 보편적일 수도", "fundamental mechanisms"), ("포유류인 쥐의 발견도 인간에 옮기기 어려움", "difficult to translate into humans"), ("쓸모 있으려면 아주 오래 걸릴 수도", "a very long time")]),
], [
 ("정의", "히드라와 불멸의 해파리는 노화 징후가 없어 '생물학적 불멸'이라 불린다", "biologically immortal"),
 ("단서", "죽지 않는다는 뜻은 아니다 — 나이 들어도 죽을 확률이 늘지 않을 뿐", "This doesn't mean they don't die."),
 ("기대", "노화를 이길 단서를 줄 수 있어 노화학자들이 들뜬다", "excite gerontologists"),
 ("반전", "하지만 몸을 통째로 재생하는 특성은 우리보다 나무에 가깝다", "more similar to trees than to us"),
 ("의문", "그 발견이 인간 노화와 관련 있을지 불분명하다 — 쥐 연구도 옮기기 어렵다", "difficult to translate into humans"),
 ("결론", "히드라·해파리 연구가 우리에게 쓸모 있으려면 아주 오래 걸릴 수 있다", "It may be a very long time before ..."),
], "히드라와 불멸의 해파리는 노화 연구에 단서를 줄 수 있지만, 재생 능력 때문에 사람과 너무 달라서 그 발견을 인간 노화에 적용하기까지는 오래 걸릴 수 있다.",
 "어법 ② making → makes: 주어가 their property(단수)이고 문장에 동사가 없으므로 동사 makes가 와야 한다.")

P("30", "어휘", "③", "보조금의 숨은 비용", "보조금의 숨은 비용", [
 ("세 가지 수단", [("보조금·세금·규제", "Subsidies, taxes, and regulations"), ("석탄에서 벗어나 오염을 줄이게 함", "switching away from coal"), ("전환하면 이윤이 더 높을 수도", "profits can be higher")]),
 ("발전소의 선호", [("규제나 세금보다 보조금을 선호", "prefer subsidies over regulations or taxes"), ("스스로 비용을 내느니 정부 돈을 받음", "receive money from the government")]),
 ("문제 1: 다른 사람의 부담", [("기회 집합의 '확대'는 다른 이의 축소와 짝", "the contraction of the opportunity set of others"), ("일반 개인을 희생해서", "at the expense of the ordinary individual"), ("보조금을 대려고 세금이 늘어남", "increased taxation")]),
 ("문제 2: 효율", [("보조금은 경제를 왜곡함", "distorts the economy"), ("전기 회사가 비용 전부를 부담하지 않음", "not facing the full costs"), ("전기 값↓ 소비↑ → 온난화 악화", "worsen global warming")]),
], [
 ("도입", "보조금·세금·규제 모두 발전소가 석탄에서 벗어나 오염을 줄이게 할 수 있다", "switching away from coal"),
 ("선호", "발전소는 그중 보조금을 좋아한다 — 비용을 내느니 돈을 받으니까", "The reason is obvious."),
 ("문제 1", "그들의 기회 확대는 다른 사람들의 기회 축소와 짝을 이룬다", "has to be matched by the contraction"),
 ("구체", "전기 회사의 '자유'는 세금을 더 내는 일반 개인을 희생해 늘어난다", "at the expense of the ordinary individual"),
 ("문제 2", "효율 면에서도 보조금은 경제를 왜곡한다", "Moreover, ... the subsidy distorts the economy"),
 ("결과", "전기 값이 낮아져 소비가 늘고 지구 온난화가 악화된다", "which will worsen global warming"),
], "발전소는 보조금을 좋아하지만, 보조금은 세금을 내는 일반 개인의 부담으로 주어지고, 전기 값을 낮춰 소비를 늘리므로 온난화를 악화시킬 수 있다.",
 "어휘 ③ decreased → increased: 전기 회사의 '자유'는 일반 개인을 희생해서(at the expense of) '늘어나는' 것이다.")

P("31", "빈칸 추론", "② scarcity", "스타 트렉: 희소성이 없는 세계", "스타 트렉 = 희소성이 없는 세계", [
 ("관점", [("경제학의 렌즈로 스타 트렉을 봄", "through an economic lens"), ("곧 다가올지 모를 세계를 보는 창", "provides a window into"), ("곧 우리에게 닥칠", "be upon us")]),
 ("고전 경제학", [("모두에게 줄 만큼 충분하지 않다는 개념에 기초", "based on the notion"), ("시장과 가격으로 재화·서비스·자원을 배분", "allocate those goods, services, and resources")]),
 ("스타 트렉의 세계", [("희소성이 거의 없음 (빈칸)", "there isn't much scarcity"), ("기술로 원하는 음식을 복제", "reproduce any food they want"), ("눈 깜짝할 사이에 이동, 광년 너머 통신", "in the blink of an eye"), ("모두 교육받아 번영에 참여", "participate in this prosperity")]),
 ("우리 사회", [("생성형 AI의 잠재력", "Generative AI has the potential"), ("사회의 여러 차원이 풍부해질 수 있음", "highly abundant")]),
], [
 ("도입", "스타 트렉을 경제학의 눈으로 보면 곧 올지 모를 세계가 보인다", "through an economic lens"),
 ("전제", "고전 경제학은 '모든 것이 부족하다'는 개념에 기초한다", "based on the notion that ..."),
 ("그래서", "시장과 가격으로 재화·서비스·자원을 배분한다", "Because of that, we use markets and pricing"),
 ("대조", "그러나 스타 트렉에는 희소성이 거의 없다 — 기술이 다 해 준다", "In Star Trek, however, ..."),
 ("모습", "모두 교육받아 번영에 참여하고, 누구나 탐험가·연구자·예술가다", "participate in this prosperity"),
 ("시사", "생성형 AI가 우리 사회도 그렇게 풍부하게 만들 수 있다", "Generative AI has the potential ..."),
], "경제학은 자원이 부족하다는 전제에서 출발하지만 스타 트렉의 세계에는 희소성이 없다. 생성형 AI가 우리 사회도 그처럼 풍부하게 만들 가능성이 있다.")

P("32", "빈칸 추론", "② demonstrate that they listened", "들어 준다고 느끼게 하려면 들었음을 보여 줘야 한다", "'들어 준다'고 느끼게 하려면: 들었음을 보여 줘라", [
 ("사람들의 바람", [("누구나 자기 말이 들린다고 느끼고 싶음", "want to feel heard"), ("마음에 걸리는 일이 있어 찾아옴", "something on their mind"), ("걱정을 듣고 해결해 주길 바람", "listening to their concerns and going to address them")]),
 ("세 가지 조건", [("① 상대가 주의를 기울였다고 느낌", "paid attention to what they said"), ("② 상대가 이해했다고 느낌", "understood what they said"), ("③ 상대가 들었음을 보여 줌 (빈칸)", "demonstrate that they listened")]),
 ("③이 핵심인 이유", [("이 마지막이 핵심", "This last part is key."), ("아무 반응이 없는 상대를 상상", "provided no response"), ("겉으로 드러나는 신호가 없으면", "outward signal"), ("실제로 들었는지 알 수 없음", "whether or not they actually did")]),
], [
 ("주장", "사람은 누구나 자기 말이 들린다고 느끼고 싶어 한다", "want to feel heard"),
 ("예", "고객 센터에 전화하거나 사무실에 찾아올 때, 걱정을 듣고 해결해 주길 바란다", "listening to their concerns"),
 ("조건", "그러려면 세 가지가 필요하다 — 주의, 이해, 그리고 들었음을 보여 주기", "three things have to happen"),
 ("강조", "그중 마지막(보여 주기)이 핵심이다", "This last part is key."),
 ("이유", "다 듣고 이해했어도 겉으로 신호가 없으면 들었는지 알 수 없다", "without some sort of outward signal"),
], "상대가 들어 준다고 느끼려면 주의와 이해만으로는 부족하고, 들었다는 것을 겉으로 보여 주는 반응이 있어야 한다.")

P("33", "빈칸 추론", "⑤ challenges the idea of place as passive backdrop", "장소는 수동적 배경이 아니라 경험의 매체다", "장소 = 수동적 배경이 아닌 경험의 매체", [
 ("경험과 공간", [("모든 경험은 물리적 공간에서 '일어난다'", "take place"), ("공간은 거기서 일어난 사건과 분리할 수 없음", "inseparable from"), ("공간·장소·경험의 뒤얽힘", "intertwining")]),
 ("핵심 (빈칸)", [("장소가 수동적 배경이라는 생각에 이의를 제기함", "challenges the idea of place as passive backdrop")]),
 ("필자의 결론", [("공간적 틀 = 모든 경험의 매체", "the spatial framework is the medium of all experiences"), ("경험 바깥의 배경·맥락이 아님", "exterior to experience"), ("흔히 생각하는 것과 달리", "as commonly supposed")]),
 ("Poulet의 말", [("벨기에의 문학 비평가", "literary critic"), ("존재는 장소를 옷처럼 두름", "wraps oneself up in a garment"), ("변장이자 성격 묘사인 옷", "a disguise and a characterization"), ("장소가 없으면 추상일 뿐", "only abstractions")]),
], [
 ("전제", "모든 경험은 물리적 공간에서 '일어나므로' 공간은 그 사건과 분리할 수 없다", "inseparable from"),
 ("주장", "이 뒤얽힘은 '장소 = 수동적 배경'이라는 생각에 이의를 제기한다 (빈칸)", "challenges the idea of place as passive backdrop"),
 ("전개", "장소가 경험의 중심이라면, 공간적 틀은 모든 경험의 매체다", "the medium of all experiences"),
 ("대조", "흔히 생각하듯 경험 바깥에 있는 배경이나 맥락이 아니다", "not merely a background or context"),
 ("인용", "Poulet — 존재는 장소를 옷처럼 두르며, 장소가 없으면 추상일 뿐이다", "Without places, beings would be only abstractions."),
], "경험은 언제나 어떤 장소에서 일어나므로 장소는 경험과 떼어 낼 수 없다. 따라서 장소는 그저 뒤에 깔린 배경이 아니라 경험을 이루는 매체다.")

P("34", "빈칸 추론", "⑤ without a complete accounting of what's happening at all other levels", "모든 모델은 '주어진 것'을 가정한다", "모든 모델은 '주어진 것'을 가정한다", [
 ("주장", [("어떤 진화 체계를 정하든 (예: 휴대 전화)", "evolutionary system of interest"), ("그냥 주어진 것으로 받아들여야 하는 것이 있음", "take as a given"), ("모든 모델은 단순화 가정을 함", "simplifying assumptions")]),
 ("예 1: 진화론", [("Wallace와 Darwin의 말로 된 모델", "verbal model of biological evolution"), ("변이 생성과 유전의 원리를 거의 몰랐음", "variation generation and inheritance"), ("어떻게든 일어난다고 받아들임", "happened somehow")]),
 ("예 2: 물리학", [("가장 세밀한 수준에서도 가정이 필요", "at the finest level of detail"), ("기본 입자의 질량과 전하", "the mass and charge of fundamental particles"), ("측정값을 받아들이고 넘어감", "accept the measured values and move on")]),
 ("핵심 (빈칸)", [("한 분석 수준에서 유용한 모델을 만들 수 있음", "at one level of analysis"), ("다른 모든 수준을 완전히 설명하지 않아도", "without a complete accounting")]),
], [
 ("주장", "어떤 체계를 모델로 삼든, 그냥 주어진 것으로 받아들여야 하는 것이 있다", "take as a given"),
 ("일반화", "모든 모델은 이런 단순화 가정을 한다", "Indeed, all models must make simplifying assumptions"),
 ("예 1", "Wallace와 Darwin은 변이와 유전의 원리를 모른 채 진화 모델을 내놓았다", "They just took as a given that ..."),
 ("예 2", "물리학자도 입자의 질량과 전하를 측정값 그대로 받아들인다", "Physicists, for example, ..."),
 ("결론", "다른 수준을 다 설명하지 않아도 한 수준에서 유용한 모델을 만들 수 있다 (빈칸)", "The key point is that ..."),
], "모든 모델은 설명하지 않고 받아들이는 가정을 가진다. 다윈도 물리학자도 그랬다. 다른 수준의 일을 전부 설명하지 못해도 한 수준에서 쓸모 있는 모델을 만들 수 있다.")

P("35", "무관한 문장", "③", "번아웃은 개인 문제가 아니라 구조적 문제다", "번아웃 = 개인이 아닌 구조의 문제", [
 ("계기", [("2019년 WHO가 번아웃을 직업 현상으로 인정", "an occupational phenomenon"), ("직장 정신 건강 담론의 중요한 순간", "the discourse on workplace mental health")]),
 ("무엇이 바뀌나", [("임상 평가와 조직의 책임을 재구성", "reframes clinical assessment and organizational responsibility"), ("구조적·체계적 예방으로 관심을 옮김", "systemic prevention")]),
 ("실천", [("고용주는 구조적 개입을 채택", "adopt structural interventions"), ("개인 수준의 처방에만 의존하지 않기", "relying solely on individual-level remedies"), ("임상의는 산업 보건·리더십과 협력해 근본 원인을 다룸", "address root causes")]),
 ("관점 전환", [("개인의 실패나 회복 탄력성 문제로 보지 않음", "a personal failing"), ("조직 문화에 뿌리내린 구조적 문제", "rooted in organizational culture"), ("부담을 개인에게만 지우지 않기", "placing the burden solely on individuals")]),
], [
 ("계기", "2019년 WHO가 번아웃을 직업 현상으로 인정했다", "an occupational phenomenon"),
 ("의미", "이 지정은 책임을 재구성해 구조적·체계적 예방으로 관심을 돌린다", "This designation reframes ..."),
 ("고용주", "개인 처방에만 기대지 말고 구조적 개입을 하라", "rather than relying solely on individual-level remedies"),
 ("임상의", "산업 보건·리더십과 협력해 근본 원인을 다뤄라", "In practice, ... address root causes"),
 ("전환", "번아웃을 개인의 실패가 아니라 조직 문화에 뿌리내린 구조적 문제로 본다", "a shift away from viewing burnout as a personal failing"),
 ("결론", "이 재구성은 개인에게만 부담을 지우지 않고 체계적 개입과 정책 변화의 문을 연다", "This reframing is essential"),
], "WHO가 번아웃을 직업 현상으로 인정하면서, 번아웃은 개인이 견뎌야 할 문제가 아니라 조직과 사회 구조가 해결해야 할 문제로 보게 되었다.",
 "무관한 문장 ③: 개인이 습관을 바꿔 스스로 회복할 수 있다는 내용이라, '개인이 아닌 구조의 문제'라는 글의 흐름과 반대다.")

P("36", "글의 순서", "② (B)-(A)-(C)", "소리는 뇌가 만드는 심리적 개념이다", "소리 = 뇌가 만드는 심리적 개념", [
 ("소리의 시작", [("어떤 움직임에서 시작", "some kind of motion"), ("매질 속 분자를 교란", "disturbs molecules"), ("공기·물·강철·나무 같은 매질", "medium")]),
 ("빛과의 비교 (Newton)", [("광파 자체는 색이 없음", "light waves are colorless"), ("색의 지각은 생물의 뇌에서만 일어남", "the perception of color"), ("소리도 마찬가지", "The same is true of sound.")]),
 ("고막에 닿기 전", [("소리의 지각은 고막에서 시작", "begins at our eardrums"), ("그 전에는 분자의 교란일 뿐", "nothing more than the disturbance of molecules"), ("측정기와 기구로 잴 수는 있음", "gauges and instruments")]),
 ("철학 수수께끼", [("숲에서 나무가 쓰러졌는데 듣는 이가 없다면?", "philosophical riddle"), ("소리는 심리적 개념, 뇌의 산물", "a product of brains"), ("어떤 생물도 듣지 못하면 소리가 난 게 아님", "it has not made sound")]),
], [
 ("주어진 글", "소리는 매질의 분자를 교란하는 움직임에서 시작한다. Newton — 색의 지각은 뇌에서만 일어난다", "light waves are colorless"),
 ("(B)", "소리도 마찬가지다. 고막에 닿기 전에는 분자의 교란일 뿐이다", "The same is true of sound."),
 ("(A)", "그 교란을 측정할 수는 있어도 뇌에 닿기 전엔 소리가 아니다 → 나무 수수께끼", "does it make a sound?"),
 ("(C)", "답은 '아니다' — 소리는 뇌가 만든 심리적 개념이기 때문이다", "No, because sound is a psychological concept"),
], "색이 뇌에서 지각될 때만 색이듯, 소리도 뇌가 지각해야 소리다. 듣는 생물이 없으면 분자의 떨림만 있을 뿐 소리는 없다.",
 "순서 단서: (B) The same is true of sound — 빛 이야기에서 소리로 넘어감 / (A) that disturbance가 (B)의 disturbance를 받고 수수께끼 질문으로 끝남 / (C) No — 그 질문의 답.")

P("37", "글의 순서", "③ (B)-(C)-(A)", "대면 협업은 매끄럽고 원격 협업에는 틈이 생긴다", "대면은 매끄럽고, 원격에는 '틈'이 생긴다", [
 ("대면 협업", [("서로와 의사소통 단서를 쉽게 볼 수 있음", "communication cues"), ("작업 공간은 의사소통 공간의 부분 집합", "a subset of the communication space"), ("Ishii: 매끄러운 의사소통", "seamless communication"), ("두 공간 사이에 기능적 분리가 없음", "no functional separation")]),
 ("원격 협업", [("작업 공간이 의사소통 공간과 분리됨", "separated from the communication space"), ("화상 회의: 한 화면엔 얼굴, 다른 화면엔 공유 문서", "a shared document"), ("단서와 작업 공간을 동시에 볼 수 없음", "at the same time as")]),
 ("결론", [("두 공간 사이의 인위적인 틈", "an artificial seam"), ("원격 통신 기술이 주는 영향", "remote communication technology"), ("의사소통 모델로 예측해야 함", "predicted through communication models")]),
], [
 ("주어진 글", "대면 협업에서는 단서를 쉽게 보므로 작업 공간이 의사소통 공간의 부분 집합이다", "a subset of the communication space"),
 ("(B)", "Ishii는 이를 '매끄러운 의사소통'이라 부른다. 그러나 원격에서는 두 공간이 분리된다", "However, when people are working remotely"),
 ("(C)", "예 — 화상 회의에서는 얼굴과 공유 문서가 다른 화면에 있어 단서를 동시에 못 본다", "For example, when video conferencing"),
 ("(A)", "그래서 두 공간 사이에 인위적인 틈이 생긴다. 모델로 예측해야 할 영향이다", "So, there is an artificial seam"),
], "얼굴을 맞대고 일하면 작업과 의사소통이 한 공간에서 이뤄지지만, 원격으로 일하면 둘이 갈라져 인위적인 틈이 생긴다.",
 "순서 단서: (B)의 this가 주어진 글의 상황을 받고 However로 원격 이야기 시작 → (C) For example(원격의 예) → (A) So(결론).")

P("38", "문장 삽입", "④", "환상적 진실 효과: 반복하면 참처럼 들린다", "환상적 진실 효과 = 반복하면 참처럼 들린다", [
 ("실험 (1977)", [("심리학자 Hasher와 Goldstein", "psychologists"), ("상식 진술 60개가 참·거짓인지 얼마나 확신하는가", "general-knowledge trivia-like statements"), ("2주 간격으로 세 번 평가", "at two-week intervals")]),
 ("설계의 핵심", [("20개만 매번 반복됨", "only twenty of the statements were repeated"), ("나머지 40개는 새것", "the other forty were new"), ("반복 대 비반복 진술의 '진실 평가' 비교", "truth-ratings")]),
 ("결과", [("발견한 것은 놀라웠음", "astonishing"), ("진술이 참이든 거짓이든 상관없이", "Regardless of whether"), ("반복에 따라 참이라는 믿음이 올라감", "as a function of repetition")]),
 ("의미", [("자주 들을수록 더 '참'처럼 들림", "the more 'true' it sounds"), ("환상적 진실 효과", "the illusory truth effect")]),
], [
 ("실험", "1977년 두 심리학자가 대학생에게 상식 진술 60개의 참·거짓을 얼마나 확신하는지 물었다", "how certain they were"),
 ("방법", "2주 간격으로 세 번 평가하게 했다", "at two-week intervals"),
 ("핵심 설계", "20개만 매번 반복되고 나머지 40개는 새로웠다", "Crucially, only twenty ..."),
 ("비교", "반복된 진술과 아닌 진술의 '진실 평가'를 비교했고, 결과는 놀라웠다", "What they found was astonishing."),
 ("결과", "참·거짓과 상관없이 반복될수록 참이라는 믿음이 올라갔다 (주어진 문장)", "as a function of repetition"),
 ("정리", "자주 들을수록 참처럼 들린다 = 환상적 진실 효과", "In other words, ..."),
], "같은 말을 반복해서 들으면 사실 여부와 상관없이 그 말을 더 참이라고 믿게 된다. 이것이 환상적 진실 효과다.",
 "삽입 ④: 'What they found was astonishing' 다음에 발견한 내용(주어진 문장)이 오고, 'In other words'가 그것을 쉽게 풀어 말한다.")

P("39", "문장 삽입", "②", "잠수할 때는 몸 안팎의 압력을 같게 유지해야 한다", "잠수: 몸 안팎의 압력을 같게", [
 ("지상에서", [("몸 표면 1㎡당 16~18톤의 일정한 기압", "constant air pressure"), ("느끼지 못함 — 외부 압력이 내부 압력과 균형", "balanced by internal pressure"), ("폐와 몸속 공기 공간", "the lungs and air cavities")]),
 ("물속에서", [("대기압에 수압까지 더해짐", "in addition to atmospheric pressure"), ("안팎의 압력이 같은 상태를 유지해야 함", "equal external and internal pressure"), ("주변 수압과 같은 압력으로 호흡 혼합 기체를 공급", "a breathing mixture is supplied")]),
 ("수압의 규칙", [("깊이에 비례해 증가", "increases proportionally with depth"), ("10m마다 1바", "1 bar for every 10 meters"), ("10m에서는 2바 → 2기압의 기체가 필요", "a pressure of 2 atmospheres")]),
], [
 ("지상", "지상에서 몸은 늘 큰 기압을 받는다", "constant air pressure"),
 ("하지만", "외부 압력이 폐·공기 공간의 내부 압력과 균형을 이뤄 느끼지 못한다", "However, this pressure is not felt"),
 ("잠수", "잠수하면 대기압에 더해 수압도 몸에 작용한다", "in addition to atmospheric pressure"),
 ("조건", "물속에서 압력을 느끼지 않으려면 안팎 압력을 같게 유지해야 한다 (주어진 문장)", "equal external and internal pressure"),
 ("방법", "주변 수압과 같은 압력의 공기나 호흡 기체를 공급한다", "To achieve this, ..."),
 ("계산", "수압은 10m마다 1바씩 늘어난다 → 10m에서는 2바, 2기압의 기체가 필요하다", "It follows that ..."),
], "지상에서는 몸 안팎의 압력이 같아 기압을 못 느낀다. 물속에서도 그 균형을 지키려면 깊이에 맞는 압력의 호흡 기체를 공급해야 한다.",
 "삽입 ②: 바로 뒤 'To achieve this'의 this가 주어진 문장(안팎의 압력을 같게 유지하는 것)을 가리킨다.")

P("40", "요약문", "① broadly … benefiting", "험한 환경의 미역취는 화학 경보를 널리 알린다", "미역취의 화학 경보: 험할수록 널리 알린다", [
 ("평화로운 곳", [("포식자의 위협이 별로 없음", "without much threat from predators"), ("매우 구체적인 화학 경보를 보냄", "chemical alarm calls"), ("가까운 친족만 이해할 수 있음", "comprehensible only to their close kin"), ("드물게 공격받을 때", "on the rare occasion")]),
 ("적대적인 곳", [("그 지역의 모든 미역취가 쉽게 이해", "easily understood by all the goldenrod in the area"), ("암호화된 속삭임 망 대신", "whisper networks"), ("확성기로 위협을 방송하는 셈", "broadcast the threat over loudspeaker")]),
 ("발견의 의미", [("받는 식물뿐 아니라 보내는 쪽에도 이로움", "beneficial ... also to the sender"), ("힘들 때 들판에 혼자 남고 싶지 않음", "left standing in a field alone"), ("짝짓기 상대와 꽃가루 매개자가 필요", "pollinators")]),
 ("요약문 빈칸", [("(A) 더 널리 이해되는 화학 메시지", "broadly"), ("(B) 보내는 쪽과 받는 쪽 모두에 이득", "benefiting")]),
], [
 ("발견 1", "평화로운 곳의 미역취는 공격받으면 가까운 친족만 이해하는 구체적인 화학 경보를 낸다", "comprehensible only to their close kin"),
 ("발견 2", "그러나 적대적인 곳의 미역취는 그 지역 모든 미역취가 이해하는 신호를 쓴다", "But goldenrods in more hostile territory"),
 ("비유", "속삭임 망 대신 확성기로 위협을 방송하는 셈이다", "over loudspeaker, so to speak"),
 ("의미", "이 화학 소통이 받는 쪽뿐 아니라 보내는 쪽에도 이롭다는 것이 처음 확인됐다", "not only ... but also to the sender"),
 ("이유", "정말 힘들 때 들판에 혼자 남으면 짝도, 꽃가루 매개자를 불러 줄 이웃도 없다", "left standing in a field alone"),
], "위협이 많은 곳의 미역취는 친족만이 아니라 주변 모든 미역취가 알아듣는 화학 신호를 보낸다. 이웃이 살아남아야 자신에게도 이롭기 때문이다.")

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mogo.html")
s = open(path, encoding="utf-8").read()
m = re.search(r'(\n<script type="application/json" id="mogo-data">\n)(.*?)(\n</script>)', s, re.S)
body = "[\n" + ",\n".join(" " + json.dumps(p, ensure_ascii=False) for p in D) + "\n]"
s = s[:m.start(2)] + body + s[m.end(2):]
open(path, "w", encoding="utf-8").write(s)
print(len(D), "지문:", " ".join(p["id"] for p in D))
