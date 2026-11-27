/* ============================================================
   DỮ LIỆU ĐỀ NGỮ PHÁP N1 – Mondai 5 & Mondai 6
   ------------------------------------------------------------
   Mỗi đề là một phần tử trong GRAMMAR_TESTS:

   {
     id: 'mau-01',               // mã duy nhất (không trùng)
     title: 'Đề mẫu 01',         // tên hiển thị
     source: 'Mogi',             // nguồn đề (không bắt buộc)
     m5: [ ...câu Mondai 5... ],
     m6: [ ...câu Mondai 6... ],
   }

   ▸ Câu Mondai 5 (文法形式の判断 – chọn từ điền vào（　）):
     {
       no: 26,                                    // số câu trong đề
       q: 'Dòng 1\nDòng 2 có（　）chỗ trống',      // \n = xuống dòng, （　） = chỗ trống
       options: ['より', 'のみ', 'には', 'だけ'],  // đúng thứ tự 1-2-3-4 như đề
       answer: 4,                                 // số thứ tự đáp án đúng (1–4)
       point: '〜だけ無駄だ',                      // điểm ngữ pháp (không bắt buộc)
       explain: 'Giải thích...',                  // giải thích (không bắt buộc)
     }

   ▸ Câu Mondai 6 (文の組み立て – sắp xếp, chọn ô ★):
     {
       no: 37,
       before: 'Phần câu trước 4 ô trống',
       after: 'Phần câu sau 4 ô trống',
       star: 3,                                   // ★ nằm ở ô thứ mấy (1–4), mặc định 3
       parts: ['A', 'B', 'C', 'D'],               // 4 lựa chọn đúng thứ tự 1-2-3-4 như đề
       order: [1, 3, 2, 4],                       // thứ tự đúng điền vào 4 ô (theo số lựa chọn)
       explain: 'Giải thích...',
     }
     → Đáp án (ô ★) được tính tự động = order[star - 1].
   ============================================================ */

const GRAMMAR_TESTS = [
  {
    id: '2024-12',
    title: 'JLPT N1 – 12/2024',
    source: 'Đề 2024年12月 · JLPT Mogi 完成版 241225 · đáp án tự giải',
    m5: [
      {
        no: 26,
        q: '宝くじ売り場があるよ、買ってみない？\nどうせ当たらないんだから、買う（　）無駄だったよ。',
        options: ['より', 'のみ', 'には', 'だけ'],
        answer: 4,
        point: 'V（る）だけ無駄だ',
        explain: '「〜だけ無駄だ」: làm ~ cũng chỉ phí công. Đằng nào cũng không trúng nên mua cũng chỉ phí tiền.',
      },
      {
        no: 27,
        q: '近年の健康意識の高まり（　）健康食品は急成長している。',
        options: ['に次いで', 'にわたって', 'を受けて', 'をめぐって'],
        answer: 3,
        point: 'N を受けて',
        explain: '「〜を受けて」: chịu tác động của ~ / tiếp nhận ~ nên… Do ý thức về sức khỏe tăng cao nên thực phẩm chức năng tăng trưởng nhanh. 「に次いで」: tiếp theo sau; 「にわたって」: suốt (phạm vi); 「をめぐって」: xoay quanh (tranh luận).',
      },
      {
        no: 28,
        q: '息子はサッカーの練習でよほど疲れていたのか、家に（　）食事もとらず、寝てしまった。',
        options: ['帰り次第', '帰るなり', '帰ったなり', '帰るとなれば'],
        answer: 2,
        point: 'V（る）なり',
        explain: '「V-るなり」: vừa ~ xong là lập tức (hành động bất ngờ của người khác, vế sau ở quá khứ). Vừa về đến nhà là lăn ra ngủ. 「V-たなり」 nghĩa là "để nguyên trạng thái ~ rồi không làm gì tiếp"; 「次第」 dùng cho ý định/yêu cầu ở tương lai.',
      },
      {
        no: 29,
        q: 'ウェブサイトごとに異なるパスワードを設定するのは面倒だが、第三者が不正にアクセスされる（　）、やむを得ない。',
        options: ['しかない以上', 'しかない反面', '恐れがある以上', '恐れがある反面'],
        answer: 3,
        point: 'Vる恐れがある ＋ 〜以上（は）',
        explain: '「〜恐れがある」: có nguy cơ ~ ; 「〜以上」: một khi đã ~ thì (đương nhiên). Một khi có nguy cơ bị truy cập trái phép thì dù phiền cũng đành chịu.',
      },
      {
        no: 30,
        q: '昨日行った美術館は、一日では（　）作品が展示されていた。',
        options: ['見きれないほどの', '見ずにはいられないほどの', '見きれないといった', '見ずにはいられないといった'],
        answer: 1,
        point: 'Vきれない ＋ ほどの N',
        explain: '「V-きれない」: không thể ~ hết; 「〜ほどの N」: N đến mức ~. Số tác phẩm nhiều đến mức một ngày không xem hết. 「ずにはいられない」: không thể không ~ (không hợp với 一日では).',
      },
      {
        no: 31,
        q: '引っ越しを控えているので、なるべく余計な出費を（　）、友人に誘われたスキー旅行に行くことにした。',
        options: ['押さえたら抑えたで', '抑えられるものなら', '抑えるには抑えずに', '押さえたいところだが'],
        answer: 4,
        point: 'Vたいところだが',
        explain: '「V-たいところだが」: muốn ~ lắm nhưng (thực tế làm khác). Sắp chuyển nhà nên muốn hạn chế chi tiêu lắm, nhưng vẫn quyết định đi trượt tuyết.',
      },
      {
        no: 32,
        q: '驚いたことに、その小学生は、高校レベルの数学の問題をすらすらと（　）。',
        options: ['解けるとは', '解けるものなら', '解いたまでだ', '解いてみせた'],
        answer: 4,
        point: 'Vてみせる',
        explain: '「V-てみせる」: làm ~ cho người khác thấy (thể hiện năng lực). Cậu bé giải trôi chảy bài toán cấp 3 trước mắt mọi người. 「解けるとは」 cần vế cảm thán phía sau; 「たまでだ」: chỉ là đã ~ thôi.',
      },
      {
        no: 33,
        q: '専門家の話では、かつてこの地域一帯は海だった（　）。',
        options: ['という', 'といえる', 'といった', 'といわれる'],
        answer: 1,
        point: '〜の話では …という（伝聞）',
        explain: '「Nの話では/によると 〜という」: nghe nói, theo ~ thì (truyền đạt lại thông tin). 「という」 kết câu là dạng truyền văn. 「といわれる」 là "người ta nói chung", không đi với nguồn cụ thể 専門家の話では.',
      },
      {
        no: 34,
        q: '子どもは生まれてくる家庭環境を選べない。だからこそ、親の経済状況によって、子どもの教育機会が奪われること（　）。',
        options: ['があるわけではない', 'であるわけではない', 'があってはならない', 'であってはならない'],
        answer: 3,
        point: '〜ことがあってはならない',
        explain: '「〜ことがあってはならない」: tuyệt đối không được để xảy ra chuyện ~. Không được để cơ hội học tập của trẻ bị tước đoạt vì kinh tế của cha mẹ. 「こと」 ở đây là "sự việc xảy ra" nên đi với 「がある」, không phải 「である」.',
      },
      {
        no: 35,
        q: '（大学で）\n先生「青木さん、今度の報告誌のモデルを青木さんにお願いできたらと思うんだけど、どうかな」\n青木「やりたいです。でも、私（　）」\n先生「もちろん」',
        options: ['だったらいいんですか', 'なんかでいいんですか', 'だったらいいんでしょう', 'なんかでいいんでしょうか'],
        answer: 4,
        point: 'N なんかでいいんでしょうか',
        explain: '「私なんかでいいんでしょうか」: người như em mà cũng được sao ạ? (khiêm tốn + hỏi lịch sự với thầy). 「なんか」 hạ thấp bản thân; 「〜でしょうか」 lịch sự hơn 「〜ですか」, phù hợp nói với giáo viên.',
      },
    ],
    m6: [
      {
        no: 36,
        before: '昨日はとても寒く、積もり',
        after: 'ずっと雪が降っていた。',
        star: 3,
        parts: ['が', 'こそ', 'しなかった', '午前中'],
        order: [2, 3, 1, 4],
        explain: '積もり｜こそ｜しなかった｜が｜午前中｜ずっと雪が降っていた。「VますこそしなかったがN」: tuy không đến mức ~ nhưng… Tuyết tuy không đọng lại nhưng suốt buổi sáng tuyết vẫn rơi.',
      },
      {
        no: 37,
        before: 'この映画はあまりにも正直で',
        after: '、コメディー作品だ。',
        star: 3,
        parts: ['真面目すぎる', '周りの人々とのトラブルが絶えない', 'がゆえに', '男の日常を描いた'],
        order: [1, 3, 2, 4],
        explain: '正直で｜真面目すぎる｜がゆえに｜周りの人々とのトラブルが絶えない｜男の日常を描いた、コメディー作品だ。「〜がゆえに」: vì ~ (văn viết). Phim hài kể về đời thường của người đàn ông vì quá thật thà, nghiêm túc nên rắc rối với mọi người không dứt.',
      },
      {
        no: 38,
        before: '',
        after: '読みやすいように、最近は、ビジネス理論を漫画でわかりやすく解説したものが多い。',
        star: 3,
        parts: ['堅苦しいものと思われるがちだが', '抵抗がある人にも', '一般的にビジネス書というと', 'ビジネス書に'],
        order: [3, 1, 4, 2],
        explain: '一般的にビジネス書というと｜堅苦しいものと思われるがちだが｜ビジネス書に｜抵抗がある人にも｜読みやすいように…「Nというと」: nói đến N thì; 「〜がちだ」: hay bị ~; 「Nに抵抗がある」: ngại, e dè với N.',
      },
      {
        no: 39,
        before: '渋滞の中を',
        after: '遊園地に入る前から疲れてしまった。',
        star: 3,
        parts: ['今度は', '3時間運転して', '駐車場が混雑していて', 'ようやくついたと思ったら'],
        order: [2, 4, 1, 3],
        explain: '渋滞の中を｜3時間運転して｜ようやくついたと思ったら｜今度は｜駐車場が混雑していて｜遊園地に入る前から疲れてしまった。「〜と思ったら、今度は…」: vừa tưởng ~ xong thì lần này lại…',
      },
      {
        no: 40,
        before: '商品やサービスが',
        after: 'ない。',
        star: 3,
        parts: ['売れるも売れないも', 'その存在が', '知られないことには', 'どんなに良い物でも'],
        order: [4, 2, 3, 1],
        explain: '商品やサービスが｜どんなに良い物でも｜その存在が｜知られないことには｜売れるも売れないもない。「〜ないことには」: nếu không ~ thì (không thể…); 「VるもVないもない」: chẳng có chuyện ~ hay không ~.',
      },
    ],
  },
];
