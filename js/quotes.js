/**
 * ZenDesk Clock - Tuyển tập những câu nói truyền cảm hứng, Stoic & Deep Work (Tiếng Việt)
 */
export const quotes = [
  { text: "Chúng ta chịu đau khổ trong tưởng tượng nhiều hơn trong thực tế.", author: "Seneca" },
  { text: "Đừng sống như thể bạn còn vạn năm phía trước. Hãy trân trọng từng phút giây.", author: "Marcus Aurelius" },
  { text: "Sự giản đơn chính là đỉnh cao của sự tinh tế.", author: "Leonardo da Vinci" },
  { text: "Tập trung sâu là khả năng làm việc không xao nhãng trên những nhiệm vụ đòi hỏi trí tuệ cao nhất.", author: "Cal Newport" },
  { text: "Chướng ngại trên con đường sẽ trở thành con đường đưa ta tiến bước.", author: "Marcus Aurelius" },
  { text: "Sự tập trung là một nhóm cơ bắp. Càng rèn luyện, bạn sẽ càng mạnh mẽ.", author: "Triết Lý Zen" },
  { text: "Thời gian bạn cảm thấy hạnh phúc khi tận hưởng không bao giờ là lãng phí.", author: "Bertrand Russell" },
  { text: "Hãy biến mỗi ngày trôi qua thành một kiệt tác của cuộc đời bạn.", author: "John Wooden" },
  { text: "Bạn có toàn quyền kiểm soát tâm trí mình, chứ không phải các biến cố bên ngoài.", author: "Marcus Aurelius" },
  { text: "Vấn đề không phải là đời người quá ngắn, mà là chúng ta đã lãng phí quá nhiều.", author: "Seneca" },
  { text: "Làm ít việc hơn, nhưng hãy làm với sự hiện diện và chú tâm trọn vẹn.", author: "Thiền Ngữ" },
  { text: "Bí mật của việc tiến lên phía trước là hãy bắt đầu ngay từ bây giờ.", author: "Mark Twain" },
  { text: "Hít vào sự sáng suốt, thở ra mọi muộn phiền và xao nhãng.", author: "Chánh Niệm" },
  { text: "Trật tự và tinh giản là những bước đầu tiên để làm chủ mọi kỹ năng.", author: "Thomas Mann" },
  { text: "Hành trình vạn dặm luôn khởi đầu từ một bước chân vững chãi.", author: "Lão Tử" },
  { text: "Biết đủ là giàu, biết dừng là thoát.", author: "Cổ Nhân" }
];

export function getRandomQuote() {
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}
