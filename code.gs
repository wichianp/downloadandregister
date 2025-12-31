function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setFaviconUrl("https://wichianp.github.io/web/logoGuruchian.png")
    .setTitle('Registration System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ฟังก์ชันดึงข้อมูลสำหรับ Dashboard
function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName('Users');
  const ratingSheet = ss.getSheetByName('Ratings');
  
  const userData = userSheet.getDataRange().getValues();
  const ratingData = ratingSheet.getDataRange().getValues();
  
  userData.shift(); // ลบหัวตาราง
  ratingData.shift(); // ลบหัวตาราง

  // 1. สถิติพื้นฐาน
  const totalUsers = userData.length;
  const totalRatings = ratingData.length;
  let sumStars = 0;
  let starDist = [0, 0, 0, 0, 0]; // สำหรับ 1-5 ดาว
  
  ratingData.forEach(row => {
    const star = parseInt(row[1]);
    sumStars += star;
    if(star >= 1 && star <= 5) starDist[star-1]++;
  });
  
  const avgStars = totalRatings > 0 ? (sumStars / totalRatings).toFixed(2) : "0.00";

  // 2. ข้อมูลกราฟวงกลมจังหวัด
  const provinceMap = {};
  userData.forEach(row => {
    const province = row[5] || 'ไม่ระบุ';
    provinceMap[province] = (provinceMap[province] || 0) + 1;
  });

  return {
    cards: { totalUsers, totalRatings, avgStars },
    starDist: starDist,
    provinces: {
      labels: Object.keys(provinceMap),
      values: Object.values(provinceMap)
    }
  };
}

// ฟังก์ชันบันทึกข้อมูล
function registerUser(data) {
  //const fileId = urlDownload.split("/")[5]
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  const userId = "ID-" + Math.random().toString(36).substring(2, 9).toUpperCase();
  sheet.appendRow([userId, data.firstName, data.lastName, data.agency, data.district, data.province, new Date()]);
  return {id: userId, fullname: data.firstName+' '+data.lastName, registered: true};
}

// ฟังก์ชันบันทึก Rating
function submitRating(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Ratings');
  sheet.appendRow([data.userId, data.stars || 0, data.comment || '', new Date()]);
  return {rated: true};
}

// ฟังก์ชันดึงข้อมูล Rating
function getRatings(page = 1, limit = 12) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName('Users');
  const rateSheet = ss.getSheetByName('Ratings');

  const users = userSheet.getDataRange().getValues();
  const ratings = rateSheet.getDataRange().getValues().slice(1).reverse();

  const userMap = {};
  for (let i = 1; i < users.length; i++) {
    userMap[users[i][0]] = {
      name: users[i][1],
      surname: users[i][2]
    };
  }

  const merged = [];
  for (let i = 0; i < ratings.length; i++) {
    const u = userMap[ratings[i][0]];
    const comment = ratings[i][2];

    // กรอง comment ที่ว่าง / เป็นช่องว่าง
    if (!u || !comment || comment.toString().trim() === '') continue;

    merged.push({
      name: u.name,
      surname: u.surname,
      stars: ratings[i][1],
      comment: ratings[i][2],
      date: Utilities.formatDate(
        new Date(ratings[i][3]),
        'Asia/Bangkok',
        'dd/MM/yyyy'
      )
    });
  }

  const total = merged.length;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: merged.slice(start, end),
    total: total
  };
}

// ฟังก์ชันดึงรายการ Projects
function getProjects(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('config');
  const data = configSheet.getDataRange().getValues();

  return data.slice(1).filter(r => r[2]).map(r => ({
    id: r[0],
    projectName: r[1],
    projectUrl: r[2],
    price: r[3],
    Free: r[4]
  }));
}
