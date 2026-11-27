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
    id: 'mau-01',
    title: 'Đề mẫu 01',
    source: 'Mogi (đề mẫu để chạy thử)',
    m5: [
      {
        no: 26,
        q: '宝くじ売り場があるよ、買ってみない？\nどうせ当たらないんだから、買う（　）無駄だったよ。',
        options: ['より', 'のみ', 'には', 'だけ'],
        answer: 4,
        point: 'V（る）だけ無駄だ',
        explain: '「〜だけ無駄だ」: làm ~ cũng chỉ phí công, vô ích. Đằng nào cũng không trúng nên mua cũng chỉ phí tiền.',
      },
      {
        no: 27,
        q: '近年の健康意識の高まり（　）健康食品は急成長している。',
        options: ['に次いで', 'にわたって', 'を受けて', 'をめぐって'],
        answer: 3,
        point: 'N を受けて',
        explain: '「〜を受けて」: chịu tác động / tiếp nhận ~ nên… Do ý thức về sức khỏe tăng cao nên thực phẩm chức năng tăng trưởng nhanh.',
      },
    ],
    m6: [
      {
        no: 37,
        before: 'この映画はあまりにも正直で',
        after: '、コメディー作品だ。',
        star: 3,
        parts: ['真面目すぎる', '周りの人々とのトラブルが絶えない', 'がゆえに', '男の日常を描いた'],
        order: [1, 3, 2, 4],
        explain: '正直で真面目すぎる｜がゆえに｜周りの人々とのトラブルが絶えない｜男の日常を描いた、コメディー作品だ。「〜がゆえに」= vì quá ~ nên.',
      },
      {
        no: 38,
        before: '',
        after: '読みやすいように、最近は、ビジネス理論を漫画でわかりやすく解説したものが多い。',
        star: 3,
        parts: ['堅苦しいものと思われるがちだが', '抵抗がある人にも', '一般的にビジネス書というと', 'ビジネス書に'],
        order: [3, 1, 4, 2],
        explain: '一般的にビジネス書というと｜堅苦しいものと思われるがちだが｜ビジネス書に｜抵抗がある人にも 読みやすいように…「〜というと」nói đến ~ thì; 「〜がちだ」thường hay bị ~.',
      },
    ],
  },
];
