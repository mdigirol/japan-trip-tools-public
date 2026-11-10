// Phrasebook content, from context/phrases.md. All Japanese is a draft until the native-speaker check (D9).
import type { Phrase, Place, Situation, Source, Venue } from './schema';

export const PHRASE_TABS = [
  { id: 'basics', label: 'Basics' },
  { id: 'chat', label: 'Chatting' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'bar', label: 'Bar' },
  { id: 'sushi', label: 'Sushi' },
  { id: 'ryokan', label: 'Ryokan & onsen' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'konbini', label: 'Konbini' },
  { id: 'taxi', label: 'Taxi' },
  { id: 'trains', label: 'Trains' },
  { id: 'temples', label: 'Temples' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'emergency', label: 'Emergency' }
] as const;

// Phrase ids a native speaker has checked (D9). `npm run review-import` adds to this list.
export const REVIEWED_PHRASES: string[] = [
];

interface Opts {
  mvp?: boolean; note?: string; sit?: Situation[]; venues?: Venue[]; places?: Place[]; slots?: string[]; sourceUrl?: string;
}

const TAB_DEFAULTS: Record<string, { sit: Situation[]; venues: Venue[] }> = {
  basics: { sit: ['asking'], venues: [] },
  chat: { sit: ['asking'], venues: [] },
  restaurant: { sit: ['ordering'], venues: ['restaurant', 'izakaya', 'yakitori', 'ramen', 'cafe'] },
  bar: { sit: ['ordering'], venues: ['cocktail-bar', 'izakaya'] },
  sushi: { sit: ['ordering'], venues: ['sushi-counter'] },
  ryokan: { sit: ['asking'], venues: ['ryokan', 'onsen'] },
  shopping: { sit: ['paying'], venues: ['shop', 'department-store', 'market'] },
  konbini: { sit: ['paying'], venues: ['konbini'] },
  taxi: { sit: ['asking'], venues: ['taxi'] },
  trains: { sit: ['asking'], venues: ['train', 'shinkansen'] },
  temples: { sit: ['asking'], venues: ['temple', 'shrine'] },
  pharmacy: { sit: ['problem'], venues: ['pharmacy'] },
  emergency: { sit: ['emergency'], venues: [] }
};

function p(tab: string, id: string, en: string, ja: string, romaji: string, source: Source[], o: Opts = {}): Phrase {
  const d = TAB_DEFAULTS[tab];
  const slots = o.slots ?? (ja.includes('[X]') ? ['X'] : undefined);
  return {
    id, tab, en, ja, romaji, source, mvp: !!o.mvp, reviewed: REVIEWED_PHRASES.includes(id),
    situations: o.sit ?? d.sit, venues: o.venues ?? d.venues,
    ...(o.places ? { places: o.places } : {}),
    ...(slots ? { slots } : {}),
    ...(o.note ? { note: o.note } : {}),
    ...(o.sourceUrl ? { sourceUrl: o.sourceUrl } : {})
  };
}

export const phrases: Phrase[] = [
  // ---- Basics ----
  p('basics', 'excuse-me', 'Excuse me / sorry (to get attention)', 'すみません', 'Sumimasen', ['N', 'T'], { mvp: true, note: 'The all-purpose opener. Say it before any question.' }),
  p('basics', 'thank-you', 'Thank you', 'ありがとうございます', 'Arigatou gozaimasu', ['N'], { mvp: true, sit: ['leaving'], note: 'Add a small nod.' }),
  p('basics', 'thank-you-kansai', 'Thank you (Kyoto/Kansai)', 'おおきに', 'Ookini', ['K'], { places: ['kyoto', 'osaka', 'nara'], sit: ['leaving'], note: 'Optional. Used mostly by older shopkeepers.' }),
  p('basics', 'please', 'Please (handing over, or asking for it)', 'お願いします', 'Onegaishimasu', ['N'], { mvp: true }),
  p('basics', 'speak-english', 'Do you speak English?', '英語は話せますか？', 'Eigo wa hanasemasu ka?', ['N', 'T'], { mvp: true, note: "Younger staff often understand English but won't offer it first." }),
  p('basics', 'dont-understand', "I don't understand", 'わかりません', 'Wakarimasen', ['T'], { mvp: true, sit: ['problem'], note: 'Not rude. It invites them to slow down or point.' }),
  p('basics', 'one-more-time', 'One more time, please', 'すみません、もう一度お願いします', 'Sumimasen, mou ichido onegaishimasu', ['N'], { mvp: true }),
  p('basics', 'im-fine', "No thank you / I'm fine", '大丈夫です', 'Daijoubu desu', ['N'], { note: 'Polite way to decline a bag, a receipt, or help.' }),
  p('basics', 'bathroom', 'Where is the restroom?', 'トイレはどこですか？', 'Toire wa doko desu ka?', ['N', 'T'], { mvp: true, note: 'Otearai (お手洗い) is the politer word.' }),
  p('basics', 'how-much', 'How much is it?', 'いくらですか？', 'Ikura desu ka?', ['N', 'T'], { mvp: true, sit: ['paying'] }),
  p('basics', 'what-is-this', 'What is this?', 'これは何ですか？', 'Kore wa nan desu ka?', ['T'], { note: 'Point at the menu item or thing.' }),
  p('basics', 'where-is-x', 'Where is [X]?', '[X]はどこですか？', '[X] wa doko desu ka?', ['N']),
  p('basics', 'where-am-i', 'Where am I? (pointing at a map)', 'ここはどこですか？', 'Koko wa doko desu ka?', ['N']),
  p('basics', 'write-it-down', 'Could you write it down?', '書いていただけますか？', 'Kaite itadakemasu ka?', ['V'], { note: 'For prices, times, addresses.' }),
  p('basics', 'no-japanese', "Sorry, I don't speak Japanese", 'すみません、日本語が話せません', 'Sumimasen, nihongo ga hanasemasen', ['V']),
  p('basics', 'good-morning', 'Good morning', 'おはようございます', 'Ohayou gozaimasu', ['N'], { sit: ['arriving'], note: 'Until about 10 or 11 am.' }),
  p('basics', 'hello', 'Hello', 'こんにちは', 'Konnichiwa', ['N'], { sit: ['arriving'] }),
  p('basics', 'good-evening', 'Good evening', 'こんばんは', 'Konbanwa', ['N'], { sit: ['arriving'] }),
  p('basics', 'speak-slowly', 'Please speak slowly', 'ゆっくり話してください', 'Yukkuri hanashite kudasai', ['V']),
  p('basics', 'got-it', 'Got it / understood', 'わかりました', 'Wakarimashita', ['V']),
  p('basics', 'got-a-moment', 'Do you have a moment?', 'ちょっといいですか？', 'Chotto ii desu ka?', ['V'], { note: 'A soft way to start a question.' }),
  p('basics', 'help-me', 'Could you help me?', '手伝ってもらえますか？', 'Tetsudatte moraemasu ka?', ['V'], { sit: ['problem'], note: 'Everyday help. In danger, use "Tasukete!" (Emergency).' }),
  p('basics', 'no-thanks', 'No, thank you', 'いいえ、結構です', 'Iie, kekkou desu', ['V'], { note: 'Firmer than daijoubu desu. Good for touts.' }),
  p('basics', 'sorry', "I'm sorry", 'ごめんなさい', 'Gomen nasai', ['V'], { note: 'For a real apology. Sumimasen covers small bumps.' }),
  p('basics', 'how-to-get-to', 'How do we get to [X]?', '[X]にはどうやって行きますか？', '[X] ni wa dou yatte ikimasu ka?', ['V']),
  p('basics', 'is-it-ok-if', 'Is it OK if I [action]?', '[action]もいいですか？', '[action] mo ii desu ka?', ['V'], { slots: ['action'], note: 'Pick an action, or point and say "Ii desu ka?"' }),
  p('basics', 'see-you-again', 'See you again (leaving a place you liked)', 'またお願いします', 'Mata onegaishimasu', ['V'], { sit: ['leaving'] }),

  // ---- Chatting ----
  p('chat', 'nice-to-meet-you', 'Nice to meet you', 'はじめまして。よろしくお願いします', 'Hajimemashite. Yoroshiku onegaishimasu', ['V'], { sit: ['arriving'] }),
  p('chat', 'how-are-you', 'How are you?', 'お元気ですか？', 'Ogenki desu ka?', ['V'], { note: 'Not a daily greeting. Use it with someone you know.' }),
  p('chat', 'genki-desu', "I'm fine (answer to how are you)", '元気です', 'Genki desu', ['V']),
  p('chat', 'see-you', 'See you!', 'またね', 'Mata ne', ['V'], { sit: ['leaving'], note: 'Casual. For friends, not staff.' }),
  p('chat', 'see-you-later', 'See you later (today)', 'また後で', 'Mata ato de', ['V'], { sit: ['leaving'], note: 'Casual. For friends, not staff.' }),
  p('chat', 'i-see', 'I see', 'なるほど', 'Naruhodo', ['V']),
  p('chat', 'thats-right', "That's true / yeah", 'そうですね', 'Sou desu ne', ['V']),
  p('chat', 'is-that-so', 'Is that so?', 'そうですか', 'Sou desu ka', ['V'], { note: 'Said with a falling tone, it just means "oh, I see."' }),
  p('chat', 'really', 'Really?', '本当ですか？', 'Hontou desu ka?', ['V'], { note: 'Casual: "Hontou?"' }),
  p('chat', 'maybe', 'Maybe', 'たぶん', 'Tabun', ['V']),
  p('chat', 'of-course', 'Of course', 'もちろん', 'Mochiron', ['V']),
  p('chat', 'sounds-good', "That's nice / sounds good", 'いいですね', 'Ii desu ne', ['V']),
  p('chat', 'same', 'Same / me too', '同じです', 'Onaji desu', ['V'], { note: 'Ordering the same? See Restaurant.' }),
  p('chat', 'im-happy', "I'm happy", '嬉しいです', 'Ureshii desu', ['V']),
  p('chat', 'not-good-yet', 'No, no, I still have a long way to go', 'いやいや、まだまだです', 'Iya iya, mada mada desu', ['V'], { note: 'The reply when told your Japanese is good. Or: "Zenzen shaberemasen" (I can barely speak it).' }),
  p('chat', 'otsukare', 'Good work / thanks for today', 'お疲れ様です', 'Otsukaresama desu', ['V'], { note: 'After work or a long day. Friends say "Otsukare!" as a toast.' }),
  p('chat', 'yabai', 'Crazy! (slang)', 'やばい', 'Yabai', ['V'], { note: 'Casual. Good or bad, from the tone.' }),
  p('chat', 'saikou', 'The best!', '最高', 'Saikou', ['V'], { note: 'Casual.' }),
  p('chat', 'sugoi', 'Amazing!', 'すごい', 'Sugoi', ['V'], { note: 'Casual. Works for almost anything.' }),
  p('chat', 'kami', 'Godlike (slang)', '神', 'Kami', ['V'], { note: 'Casual. For something perfect.' }),
  p('chat', 'egui', 'Intense! (slang)', 'エグい', 'Egui', ['V'], { note: 'Casual.' }),
  p('chat', 'kamitteru', 'On fire! (slang)', '神ってる', 'Kamitteru', ['V'], { note: 'Casual. Someone on a roll.' }),
  p('chat', 'smart-foreigner', '(Silly) Smart white guy', '頭いい白人', 'Atama ii hakujin', ['V'], { note: 'A joke about yourself. Friends only.' }),
  p('chat', 'not-bad-foreigner', "(Silly) I'm not a bad white guy", '悪い白人じゃないよ', 'Warui hakujin janai yo', ['V'], { note: 'A joke about yourself. Friends only.' }),
  p('chat', 'alcoholic-joke', "(Silly) I get it, I'm an alcoholic", 'わかる、アル中だから', 'Wakaru, aruchuu dakara', ['V'], { note: 'A drinking joke. Friends only.' }),

  // ---- Restaurant and izakaya ----
  p('restaurant', 'two-people', 'Two people', '二人です', 'Futari desu', ['V'], { mvp: true, sit: ['arriving'], note: 'Show two fingers too.' }),
  p('restaurant', 'no-reservation', "We don't have a reservation. Is there a table?", '予約していませんが、席はありますか？', 'Yoyaku shite imasen ga, seki wa arimasu ka?', ['V'], { mvp: true, sit: ['arriving'] }),
  p('restaurant', 'reservation-under', 'I have a reservation under [name]', '[name]で予約しています', '[name] de yoyaku shite imasu', ['V'], { sit: ['arriving'], slots: ['name'] }),
  p('restaurant', 'english-menu', 'Is there an English menu?', '英語のメニューはありますか？', 'Eigo no menyuu wa arimasu ka?', ['V']),
  p('restaurant', 'recommend', 'What do you recommend?', 'おすすめは何ですか？', 'Osusume wa nan desu ka?', ['N'], { mvp: true, note: '"Osusume" also appears on menus: the house picks.' }),
  p('restaurant', 'this-one', 'This one, please', 'これをください', 'Kore o kudasai', ['N'], { mvp: true, venues: ['restaurant', 'izakaya', 'yakitori', 'ramen', 'cafe', 'shop', 'market', 'konbini'], note: 'Point at the photo.' }),
  p('restaurant', 'one-of-these', 'One of these, please', 'これを一つください', 'Kore o hitotsu kudasai', ['N'], { note: 'Futatsu = two, mittsu = three.' }),
  p('restaurant', 'draft-beer', 'A draft beer, please', '生ビールをお願いします', 'Nama biiru o onegaishimasu', ['N'], { venues: ['restaurant', 'izakaya', 'yakitori'] }),
  p('restaurant', 'non-smoking', 'Do you have non-smoking seats?', '禁煙席はありますか？', "Kin'en seki wa arimasu ka?", ['N'], { sit: ['arriving'], note: 'Small old izakaya often allow smoking.' }),
  p('restaurant', 'card-ok', 'Can I pay by card?', 'カードは使えますか？', 'Kaado wa tsukaemasu ka?', ['V'], { mvp: true, sit: ['paying'], venues: ['restaurant', 'izakaya', 'yakitori', 'ramen', 'cafe', 'cocktail-bar', 'shop', 'market'], note: 'Ask before ordering in small places.' }),
  p('restaurant', 'check-please', 'Check, please', 'お会計お願いします', 'Okaikei onegaishimasu', ['N', 'T'], { mvp: true, sit: ['paying'], venues: ['restaurant', 'izakaya', 'yakitori', 'ramen', 'cafe', 'cocktail-bar', 'sushi-counter'], note: 'At many casual places you ask for the check and pay at the register. Follow the venue’s instructions.' }),
  p('restaurant', 'delicious', 'It was delicious', 'おいしかったです', 'Oishikatta desu', ['N'], { sit: ['leaving'], note: '"Oishii!" mid-meal works too.' }),
  p('restaurant', 'gochisousama', 'Thank you for the meal (leaving)', 'ごちそうさまでした', 'Gochisousama deshita', ['N'], { sit: ['leaving'], venues: ['restaurant', 'izakaya', 'yakitori', 'ramen', 'sushi-counter', 'ryokan'] }),
  p('restaurant', 'itadakimasu', '(Before eating)', 'いただきます', 'Itadakimasu', ['V']),
  p('restaurant', 'for-here', 'For here', '店内で', 'Tennai de', ['N'], { venues: ['cafe', 'restaurant', 'konbini'] }),
  p('restaurant', 'to-go', 'To go', '持ち帰りで', 'Mochikaeri de', ['N'], { venues: ['cafe', 'restaurant', 'konbini'] }),
  p('restaurant', 'table-seat', 'A table, please', 'テーブル席でお願いします', 'Teeburu seki de onegaishimasu', ['V'], { sit: ['arriving'] }),
  p('restaurant', 'counter-seat', 'The counter, please', 'カウンター席でお願いします', 'Kauntaa seki de onegaishimasu', ['V'], { sit: ['arriving'] }),
  p('restaurant', 'tatami-seat', 'Tatami seating, please', '座敷でお願いします', 'Zashiki de onegaishimasu', ['V'], { sit: ['arriving'], note: 'Zashiki means shoes off.' }),
  p('restaurant', 'oishii', 'Delicious!', 'おいしい！', 'Oishii!', ['V']),
  p('restaurant', 'one-more', 'One more, please', 'もう一つお願いします', 'Mou hitotsu onegaishimasu', ['V']),
  p('restaurant', 'same-please', 'The same, please', '同じものをお願いします', 'Onaji mono o onegaishimasu', ['V'], { note: 'Point at the dish or glass.' }),
  p('restaurant', 'thats-all', "That's all (done ordering)", '以上です', 'Ijou desu', ['V'], { note: 'Done eating? "Onaka ippai desu" means "I\'m full."' }),

  // ---- Sushi ----
  p('sushi', 'omakase', "Chef's choice, please", 'おまかせでお願いします', 'Omakase de onegaishimasu', ['V']),
  p('sushi', 'no-wasabi', 'Without wasabi', 'わさび抜きで', 'Wasabi nuki de', ['V']),
  p('sushi', 'what-fish', 'What fish is this?', 'これは何の魚ですか？', 'Kore wa nan no sakana desu ka?', ['V']),
  p('sushi', 'wonderful', 'It was wonderful', 'とてもおいしかったです', 'Totemo oishikatta desu', ['V'], { sit: ['leaving'], note: 'Say it to the chef as you leave.' }),

  // ---- Bars ----
  p('bar', 'cover-charge', 'Is there a cover charge?', 'チャージはありますか？', 'Chaaji wa arimasu ka?', ['V'], { mvp: true, sit: ['arriving'] }),
  p('bar', 'two-seats', 'Two people. Are there seats?', '二人ですが、空いていますか？', 'Futari desu ga, aite imasu ka?', ['V'], { sit: ['arriving'] }),
  p('bar', 'not-sweet', 'Something not too sweet', '甘くないものをお願いします', 'Amakunai mono o onegaishimasu', ['V']),
  p('bar', 'your-pick', 'Your recommendation, please', 'おすすめでお願いします', 'Osusume de onegaishimasu', ['V']),
  p('bar', 'neat', 'Neat', 'ストレートで', 'Sutoreeto de', ['V']),
  p('bar', 'on-the-rocks', 'On the rocks', 'ロックで', 'Rokku de', ['V']),
  p('bar', 'highball', 'As a highball', 'ハイボールで', 'Haibooru de', ['V'], { note: 'Whisky and soda.' }),
  p('bar', 'another', 'Another one, please', 'おかわりお願いします', 'Okawari onegaishimasu', ['V']),
  p('bar', 'cheers', 'Cheers!', '乾杯！', 'Kanpai!', ['V']),
  p('bar', 'one-more-drink', 'One more drink, please', 'もう一杯お願いします', 'Mou ippai onegaishimasu', ['V']),
  p('bar', 'drink-together', "Let's drink together!", '一緒に飲みましょう！', 'Issho ni nomimashou!', ['V']),

  // ---- Ryokan and onsen ----
  p('ryokan', 'dinner-time', 'What time is dinner?', '夕食は何時ですか？', 'Yuushoku wa nanji desu ka?', ['V'], { places: ['hakone'], note: 'Dinner time is fixed. Be on time.' }),
  p('ryokan', 'breakfast-time', 'What time is breakfast?', '朝食は何時ですか？', 'Choushoku wa nanji desu ka?', ['V'], { places: ['hakone'] }),
  p('ryokan', 'private-bath', 'Is there a private bath?', '貸切風呂はありますか？', 'Kashikiri-buro wa arimasu ka?', ['N']),
  p('ryokan', 'tattoo-ok', 'I have a tattoo. Is the main bath OK?', '入れ墨がありますが、大浴場は大丈夫ですか？', 'Irezumi ga arimasu ga, daiyokujou wa daijoubu desu ka?', ['N'], { note: 'Ask ahead. The tattoo show card says it in full.' }),
  p('ryokan', 'osewa', 'Thank you for taking care of us (checkout)', 'お世話になりました', 'Osewa ni narimashita', ['N'], { sit: ['leaving'], venues: ['ryokan'], note: 'The standard send-off line.' }),

  // ---- Shopping ----
  p('shopping', 'tax-free', 'Is this tax-free?', '免税できますか？', 'Menzei dekimasu ka?', ['V'], { mvp: true, venues: ['shop', 'department-store'], note: 'Have your passport out.' }),
  p('shopping', 'no-bag', "I don't need a bag", '袋はいりません', 'Fukuro wa irimasen', ['V'], { venues: ['shop', 'department-store', 'konbini', 'market'] }),
  p('shopping', 'bag-please', 'A bag, please', '袋をお願いします', 'Fukuro o onegaishimasu', ['V'], { venues: ['shop', 'department-store', 'konbini', 'market'], note: 'Bags cost a few yen.' }),
  p('shopping', 'try-on', 'Can I try it on?', '試着してもいいですか？', 'Shichaku shite mo ii desu ka?', ['V'], { sit: ['asking'] }),
  p('shopping', 'bigger-size', 'Do you have a bigger size?', '大きいサイズはありますか？', 'Ookii saizu wa arimasu ka?', ['V'], { sit: ['asking'], note: 'Japanese sizes run small.' }),
  p('shopping', 'receipt', 'Receipt, please', 'レシートをください', 'Reshiito o kudasai', ['V'], { note: 'Keep every receipt for tax-free.' }),
  p('shopping', 'gift-wrap', 'Can you wrap it as a gift?', 'プレゼント用に包んでもらえますか？', 'Purezento-you ni tsutsunde moraemasu ka?', ['V'], { sit: ['asking'] }),
  p('shopping', 'have-this', 'Do you have this?', 'これはありますか？', 'Kore wa arimasu ka?', ['V'], { sit: ['asking'], note: 'Show a photo on your phone.' }),

  // ---- Konbini ----
  p('konbini', 'heat-it', 'Please heat it up', '温めてください', 'Atatamete kudasai', ['V'], { note: 'Staff usually ask: "Atatamemasu ka?" Answer hai (yes) or iie (no).' }),
  p('konbini', 'chopsticks', 'Chopsticks, please', 'お箸をください', 'Ohashi o kudasai', ['V']),
  p('konbini', 'send-luggage', "I'd like to send luggage (takkyubin)", '荷物を送りたいです', 'Nimotsu o okuritai desu', ['T', 'V'], { sit: ['asking'] }),

  // ---- Taxi ----
  p('taxi', 'to-x', 'To [X], please', '[X]までお願いします', '[X] made onegaishimasu', ['V'], { mvp: true, note: 'Better: show the hotel card.' }),
  p('taxi', 'stop-here', 'Please stop here', 'ここで止めてください', 'Koko de tomete kudasai', ['V'], { sit: ['leaving'] }),
  p('taxi', 'taxi-receipt', 'Receipt, please', '領収書をください', 'Ryoushuusho o kudasai', ['V'], { sit: ['paying'] }),
  p('taxi', 'taxi-card', 'Can I pay by card?', 'カードで払えますか？', 'Kaado de haraemasu ka?', ['V'], { sit: ['paying'] }),
  p('taxi', 'trunk', 'Please open the trunk', 'トランクを開けてください', 'Toranku o akete kudasai', ['V'], { note: "Don't touch the doors; they open on their own." }),

  // ---- Trains ----
  p('trains', 'which-platform', 'Which platform for [X]?', '[X]行きは何番線ですか？', '[X] yuki wa nanbansen desu ka?', ['V']),
  p('trains', 'stops-at', 'Does this train stop at [X]?', 'この電車は[X]に止まりますか？', 'Kono densha wa [X] ni tomarimasu ka?', ['V']),
  p('trains', 'lost-ticket', 'I lost my ticket', '切符をなくしました', 'Kippu o nakushimashita', ['V'], { sit: ['problem'] }),
  p('trains', 'missed-train', 'I missed my train', '電車に乗り遅れました', 'Densha ni noriokuremashita', ['V'], { sit: ['problem'] }),
  p('trains', 'goes-to', 'Does this train go to [X]?', 'この電車は[X]に行きますか？', 'Kono densha wa [X] ni ikimasu ka?', ['V']),
  p('trains', 'getting-off', "I'm getting off (crowded car)", '降ります', 'Orimasu', ['V'], { note: 'Say it as you squeeze toward the door.' }),

  // ---- Temples and shrines ----
  p('temples', 'photo-ok', 'May I take a photo?', '写真を撮ってもいいですか？', 'Shashin o totte mo ii desu ka?', ['T', 'V'], { note: 'Assume no inside halls.' }),
  p('temples', 'goshuin', 'A goshuin (temple stamp), please', '御朱印をお願いします', 'Goshuin o onegaishimasu', ['K'], { note: 'About ¥300–500.' }),

  // ---- Pharmacy and health ----
  p('pharmacy', 'it-hurts', 'It hurts (point)', '痛いです', 'Itai desu', ['T'], { mvp: true, venues: ['pharmacy'] }),
  p('pharmacy', 'headache', 'I have a headache', '頭が痛いです', 'Atama ga itai desu', ['N']),
  p('pharmacy', 'stomach', 'My stomach hurts', 'お腹が痛いです', 'Onaka ga itai desu', ['N']),
  p('pharmacy', 'fever', 'I have a fever', '熱があります', 'Netsu ga arimasu', ['N']),
  p('pharmacy', 'cough', 'I have a cough', '咳が出ます', 'Seki ga demasu', ['N']),
  p('pharmacy', 'diarrhea', 'I have diarrhea', '下痢です', 'Geri desu', ['N']),
  p('pharmacy', 'motion-sickness', 'Do you have motion-sickness medicine?', '酔い止めはありますか？', 'Yoidome wa arimasu ka?', ['N'], { sit: ['asking'] }),
  p('pharmacy', 'painkiller', 'Do you have a painkiller?', '痛み止めはありますか？', 'Itamidome wa arimasu ka?', ['N'], { sit: ['asking'] }),
  p('pharmacy', 'what-for', 'What is this for?', 'これは何に効きますか？', 'Kore wa nani ni kikimasu ka?', ['N'], { sit: ['asking'] }),

  // ---- Emergency ----
  p('emergency', 'help', 'Help!', '助けて！', 'Tasukete!', ['V'], { mvp: true }),
  p('emergency', 'ambulance', 'Please call an ambulance', '救急車を呼んでください', 'Kyuukyuusha o yonde kudasai', ['V'], { mvp: true }),
  p('emergency', 'police', 'Please call the police', '警察を呼んでください', 'Keisatsu o yonde kudasai', ['V']),
  p('emergency', 'hospital', 'Where is the hospital?', '病院はどこですか？', 'Byouin wa doko desu ka?', ['T'], { sit: ['asking', 'emergency'] }),
  p('emergency', 'lost-wallet', 'I lost my wallet', '財布をなくしました', 'Saifu o nakushimashita', ['V'], { sit: ['problem'] }),
  p('emergency', 'lost-phone', 'I lost my phone', '携帯をなくしました', 'Keitai o nakushimashita', ['V'], { sit: ['problem'] }),
  p('emergency', 'lost-passport', 'I lost my passport', 'パスポートをなくしました', 'Pasupooto o nakushimashita', ['V'], { sit: ['problem'], note: 'Report it at the koban, then call your embassy.' }),
  p('emergency', 'police-box', 'Where is the police box?', '交番はどこですか？', 'Kouban wa doko desu ka?', ['V'], { sit: ['problem', 'asking'], note: 'Lost property goes to the koban or the station office.' })
];

// Quick picks offered for each slot name, alongside free typing.
export const SLOT_PICKS: Record<string, { en: string; ja: string; romaji: string }[]> = {
  X: [
    { en: 'Tokyo Station', ja: '東京駅', romaji: 'Toukyou-eki' },
    { en: 'Shinjuku Station', ja: '新宿駅', romaji: 'Shinjuku-eki' },
    { en: 'Shibuya Station', ja: '渋谷駅', romaji: 'Shibuya-eki' },
    { en: 'Kyoto Station', ja: '京都駅', romaji: 'Kyouto-eki' },
    { en: 'Osaka (Namba)', ja: '難波', romaji: 'Nanba' },
    { en: 'Nara', ja: '奈良', romaji: 'Nara' },
    { en: 'Hakone-Yumoto', ja: '箱根湯本', romaji: 'Hakone-Yumoto' },
    { en: 'Haneda Airport', ja: '羽田空港', romaji: 'Haneda kuukou' }
  ],
  name: [],
  action: [
    { en: 'sit here', ja: 'ここに座って', romaji: 'Koko ni suwatte' },
    { en: 'take a photo', ja: '写真を撮って', romaji: 'Shashin o totte' },
    { en: 'come in', ja: '入って', romaji: 'Haitte' },
    { en: 'use this', ja: 'これを使って', romaji: 'Kore o tsukatte' },
    { en: 'try it', ja: '試して', romaji: 'Tameshite' }
  ]
};
