function reviewText_(sh,date) {
  const parts=[];
  [1,3,7].forEach(n=>{
    const before=dateBefore_(date,n), row=findRow_(sh,before);
    if (row) parts.push('【'+n+'天前 '+before+'】\n'+
      sh.getRange(row,3).getDisplayValue());
  });
  return parts.join('\n\n')||'尚無前1、3、7天教材。';
}
function makeMail_(sh,row) {
  const r=sh.getRange(row,1,1,11).getDisplayValues()[0];
  const target=getTarget_();
  const days=dayNumber_(target)-dayNumber_(r[0]);
  const body=[
    '今天是 '+r[0],'距離 '+target+' 還有 '+days+' 天。',
    '當日不計入，目標日為0天。','', '今日主題：'+r[1],
    '【單字與搭配詞】',r[2],'','【句型重點】',r[3],'',
    '【閱讀與練習】',r[4],'','【翻譯或寫作】',r[5],'',
    '請先作答，再看下方解答。','','【答案與解析】',r[6],
    '','【間隔複習】',reviewText_(sh,r[0]),'',
    'AI原創教材，非官方試題；疑義請再查證。'
  ].join('\n');
  return {subject:'【倒數'+days+'天｜學測英文】'+r[0]+' '+r[1],
    body:body};
}
function buildEmailHtml_(sh,row) {
  const r=sh.getRange(row,1,1,11).getDisplayValues()[0];
  const target=getTarget_();
  const days=dayNumber_(target)-dayNumber_(r[0]);
  const format=s=>escapeHtml_(s)
    .replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\r?\n/g,'<br>');
  const card=(title,content,color)=>`
<tr><td class="wrap" style="padding:0 24px 18px">
<table role="presentation" width="100%" cellspacing="0"
cellpadding="0" style="table-layout:fixed;border:1px solid #dfe5ee;
border-radius:12px;background:${color||'#ffffff'}">
<tr><td class="pad" style="padding:20px">
<h2 class="section" style="margin:0 0 12px;font-size:20px;
line-height:1.5;color:#17324d">${escapeHtml_(title)}</h2>
<div class="text" style="font-size:16px;line-height:1.85;
color:#334155;overflow-wrap:break-word">${format(content)}</div>
</td></tr></table></td></tr>`;
  return `<!doctype html><html lang="zh-Hant"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body,table,td,div,p,h1,h2{
-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
@media only screen and (max-width:600px){
.outer{padding:12px 6px!important}
.wrap{padding:0 14px 14px!important}
.pad{padding:15px 14px!important}
.head{padding:22px 18px!important}
.title{font-size:23px!important}
.section{font-size:17px!important}
.text{font-size:14px!important;line-height:1.8!important}
.count{font-size:38px!important}
}
</style></head>
<body style="margin:0;background:#eef3f8;
font-family:Arial,'Microsoft JhengHei',sans-serif">
<table role="presentation" width="100%" cellspacing="0"
cellpadding="0"><tr><td align="center" class="outer"
style="padding:24px 8px">
<table role="presentation" width="100%" cellspacing="0"
cellpadding="0" style="max-width:680px;table-layout:fixed;
background:#ffffff;border-radius:16px">
<tr><td class="head" style="padding:30px 24px;background:#17324d">
<p style="color:#8ad6ff;font-size:12px">DAILY ENGLISH</p>
<h1 class="title" style="font-size:28px;color:white;margin:0">
每日學測英文</h1>
<p style="font-size:14px;color:#dbeafe">${escapeHtml_(r[0])}</p>
</td></tr>
<tr><td class="pad" style="padding:24px;text-align:center">
<p style="font-size:14px;color:#155e75">
距離 ${escapeHtml_(target)}</p>
<p class="count" style="font-size:48px;color:#0e7490;
font-weight:bold;margin:8px 0">${days} 天</p>
<p style="font-size:12px;color:#64748b">當日不計入，目標日為0天</p>
<h2 class="section" style="font-size:23px;color:#17324d">
${escapeHtml_(r[1])}</h2></td></tr>
${card('01 單字與搭配詞',r[2])}
${card('02 句型重點',r[3],'#f8fafc')}
${card('03 閱讀與練習',r[4])}
${card('04 翻譯或寫作',r[5],'#f8fafc')}
${card('先停一下','完成練習後，再往下核對答案。','#fff7ed')}
${card('05 解答與解析',r[6],'#f0fdf4')}
${card('06 間隔複習',reviewText_(sh,r[0]),'#eff6ff')}
<tr><td style="padding:12px 24px 28px;font-size:12px;
line-height:1.8;color:#64748b;text-align:center">
AI原創教材，非官方試題；疑義請再查證。
</td></tr></table></td></tr></table></body></html>`;
}
