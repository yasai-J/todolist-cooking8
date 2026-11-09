(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='myLittleDays.v3';
const recipes=[
 ['おにぎり','onigiri.png','onigiri_almost.png','onigiri_done.png'],
 ['サンドイッチ','sandwich.png','sandwich.png','sandwich.png'],
 ['パンケーキ','pancakes.png','pancakes_almost.png','pancakes_done.png'],
 ['親子丼','oyakodon.png','oyakodon_almost.png','oyakodon_done.png'],
 ['ラーメン','ramen.png','ramen_almost.png','ramen_done.png'],
 ['うどん','udon.png','udon_almost.png','udon_done.png'],
 ['サラダ','salad.png','salad_almost.png','salad_done.png'],
 ['パフェ','parfait.png','parfait_almost.png','parfait_done.png'],
 ['グラタン','gratin.png','gratin_almost.png','gratin_done.png'],
 ['ハンバーグ','hamburger_steak.png','hamburger_steak_almost.png','hamburger_steak_done.png'],
 ['パスタ','pasta.png','pasta_almost.png','pasta_done.png'],
 ['カレーライス','curry.png','curry_almost.png','curry_done.png'],
 ['オムライス','omurice.png','omurice_almost.png','omurice_done.png']
];
const moods=[['しょんぼり','mood_0.png'],['ちょっとブルー','mood_1.png'],['ふつう','mood_2.png'],['すこしうれしい','mood_3.png'],['うれしい','mood_4.png'],['とってもハッピー','mood_5.png']];
const stages=[['準備前',0,19],['準備中',20,39],['調理開始',40,59],['仕上げ中',60,79],['もうすぐ完成',80,99],['完成',100,100]];
const todayKey=()=>new Date().toLocaleDateString('sv-SE');
const weekKey=(d=new Date())=>{let x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));let day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);let y=x.getUTCFullYear();let start=new Date(Date.UTC(y,0,1));let w=Math.ceil((((x-start)/86400000)+1)/7);return `${y}-W${String(w).padStart(2,'0')}`};
const monthKey=()=>todayKey().slice(0,7);
const defaultState=()=>({tasks:[],dailyDone:{},weeklyDone:{},moods:{},dishByDay:{},history:[],created:todayKey(),recipeOrderVersion:2});
let state=load();
function load(){try{let x=JSON.parse(localStorage.getItem(KEY));if(!x||typeof x!=='object')return defaultState();let data={...defaultState(),...x};data.tasks=(data.tasks||[]).map((t,i)=>({...t,order:Number.isFinite(t.order)?t.order:i,hiddenFromList:!!t.hiddenFromList}));if((x.recipeOrderVersion||0)<2){const oldRecipeOrder=['おにぎり','親子丼','ラーメン','うどん','サラダ','パフェ','パンケーキ','グラタン','ハンバーグ','パスタ','カレーライス','オムライス'];for(const [day,index] of Object.entries(data.dishByDay||{})){if(Number.isInteger(index)&&oldRecipeOrder[index]){const migrated=recipes.findIndex(r=>r[0]===oldRecipeOrder[index]);if(migrated>=0)data.dishByDay[day]=migrated}}data.recipeOrderVersion=2}return data}catch{return defaultState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function id(){return 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function dateLabel(){const d=new Date();return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}（${'日月火水木金土'[d.getDay()]}）`}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function isDone(t){if(t.category==='daily')return !!state.dailyDone[todayKey()]?.[t.id];if(t.category==='weekly')return !!state.weeklyDone[weekKey()]?.[t.id];return !!t.completed}
function setDone(t,v){
 if(t.category==='daily'){state.dailyDone[todayKey()]??={};state.dailyDone[todayKey()][t.id]=v;}
 else if(t.category==='weekly'){state.weeklyDone[weekKey()]??={};state.weeklyDone[weekKey()][t.id]=v;}
 else {t.completed=v;t.completedAt=v?todayKey():null;}
 save();render();
}
let selectedTaskId=null;
const actionDialog=$('#taskActionDialog'),archiveConfirm=$('#archiveConfirm');
function openTaskActions(t){selectedTaskId=t.id;$('#taskActionTitle').textContent=t.name;actionDialog.showModal()}
function openArchiveConfirm(){actionDialog.close();archiveConfirm.showModal()}
$('#closeTaskAction').onclick=()=>actionDialog.close();
$('#actionEdit').onclick=()=>{const t=state.tasks.find(x=>x.id===selectedTaskId);actionDialog.close();if(t)openTask(t)};
$('#actionArchive').onclick=openArchiveConfirm;
$('#cancelArchive').onclick=()=>archiveConfirm.close();
$('#confirmArchive').onclick=()=>{const t=state.tasks.find(x=>x.id===selectedTaskId);if(t){t.hiddenFromList=true;t.hiddenAt=todayKey();save();render();toast('アーカイブに移動しました')}archiveConfirm.close();selectedTaskId=null};

function visibleToday(t){if(t.hiddenFromList)return false;if(t.category==='daily')return !t.days?.length||t.days.includes(new Date().getDay());if(t.category==='weekly')return true;if(t.category==='deadline'||t.category==='wish')return true;return false}
function dueText(t){if(t.category!=='deadline'||!t.due)return '';const late=t.due<todayKey()&&!t.completed;return `${late?'期限超過':'期限'} ${t.due}${late?' · OVERDUE':''}`}
function groupLabel(c){return ({daily:'DAILY ROUTINE',weekly:'WEEKLY ROUTINE',deadline:'DEADLINE',wish:'WISH LIST'})[c]}
function taskRow(t){const done=isDone(t),meta=dueText(t);return `<div class="task-row" data-id="${t.id}" data-category="${t.category}"><button class="drag-handle" type="button" aria-label="長押しして並べ替え" title="長押しして並べ替え">⠿</button><input class="task-check" type="checkbox" aria-label="${esc(t.name)}を完了" ${done?'checked':''}><span class="task-name ${done?'done':''}">${esc(t.name)}</span><span class="task-meta ${meta.includes('OVERDUE')?'overdue':''}">${esc(meta)}</span><button class="task-edit" aria-label="編集・HOMEから非表示">···</button></div>`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function todayTasks(){return state.tasks.filter(visibleToday).sort((a,b)=>(a.order??0)-(b.order??0))}
function dailyStats(){const ts=state.tasks.filter(t=>{if(t.hiddenFromList)return false;if(t.category==='daily'||t.category==='weekly')return visibleToday(t);if(t.category==='deadline')return t.due===todayKey();return false});const done=ts.filter(isDone).length;return {done,total:ts.length,pct:ts.length?Math.round(done/ts.length*100):0}}
function getDish(){let k=todayKey(),unlocked=unlockedCount();if(Number.isInteger(state.dishByDay[k])&&state.dishByDay[k]<unlocked)return state.dishByDay[k];let prev=state.dishByDay[Object.keys(state.dishByDay).sort().at(-1)];let pool=recipes.map((_,i)=>i).filter(i=>i<unlocked&&i!==prev);if(!pool.length)pool=[0];let n=pool[Math.floor(Math.random()*pool.length)];state.dishByDay[k]=n;save();return n}
function currentStage(p){return p===100?5:stages.findIndex(s=>p>=s[1]&&p<=s[2])}
// 調理イラストは達成率に応じて工程順に表示する。ランダム切替は行わない。
const simmerRecipes=new Set(['親子丼','ラーメン','うどん','グラタン','カレーライス']);
function cookingIllustration(pct,recipeName){
 if(recipeName==='パンケーキ')return pct<40?'dessert_mix.png':'oven_bake.png';
 if(recipeName==='パフェ')return 'fruit_cut.png';
 if(pct<40)return 'veg_cut.png';
 return simmerRecipes.has(recipeName)?'pot_simmer.png':'pan_fry.png';
}
// TOP画面ではシェフを固定し、机の上の料理だけを達成率に応じて切り替える。
function homeDishImage(recipe,pct){
 if(pct===0)return null;
 if(pct<=25)return cookingIllustration(1,recipe[0]);
 if(pct<=74)return cookingIllustration(50,recipe[0]);
 if(pct<100)return dishStageImage(recipe,4);
 return dishStageImage(recipe,5);
}
function homeStageLabel(pct){
 if(pct===0)return '準備中';
 if(pct<=25)return '下ごしらえ中';
 if(pct<=74)return '調理中';
 if(pct<100)return '仕上げ中';
 return '完成！';
}
function dishStageImage(recipe,stage){
 if(recipe[0]==='パフェ'){
  if(stage===4)return 'parfait_almost_custom.png';
  if(stage===5)return 'parfait_done_custom.png';
 }
 return stage===4?recipe[2]:stage===5?recipe[3]:recipe[1];
}
function renderHome(){
 const st=dailyStats();const hasTasks=st.total>0;$('#tableProgress').hidden=!hasTasks;
 if(hasTasks){$('#dailyPct').textContent=st.pct+'%';$('#dailyBar').style.width=st.pct+'%';$('#dailyCount').textContent=`${st.done} / ${st.total} 完了`;}
 const r=recipes[getDish()];$('#stageName').textContent=homeStageLabel(st.pct);$('#mascotMain').src='chef_base.png';
 $('#todayDishName').textContent=hasTasks?`今日のごはん：${r[0]}`:'今日のごはん';const dishSrc=homeDishImage(r,st.pct);$('#homeDish').hidden=!dishSrc;$('#homeEmptyPlate').hidden=!!dishSrc;if(dishSrc)$('#homeDish').src=dishSrc;
 const tasks=todayTasks();$('#homeTasks').innerHTML=['daily','weekly','deadline','wish'].map(c=>{let list=tasks.filter(t=>t.category===c);return list.length?`<div class="task-group ${c}"><div class="task-group-title">${groupLabel(c)}</div>${list.map(taskRow).join('')}</div>`:''}).join('')||'<div class="empty-state">今日のタスクはまだありません。</div>';
 $$('#homeTasks .task-row').forEach(row=>{let t=state.tasks.find(x=>x.id===row.dataset.id);row.querySelector('.task-check').onchange=e=>setDone(t,e.target.checked);row.querySelector('.task-edit').onclick=()=>openTaskActions(t);row.querySelector('.task-name').onpointerdown=e=>startTaskLongPress(e,t);row.querySelector('.task-name').onpointerup=cancelTaskLongPress;row.querySelector('.task-name').onpointerleave=cancelTaskLongPress;row.querySelector('.task-name').onpointercancel=cancelTaskLongPress;attachDrag(row,t)});
 const mood=state.moods[todayKey()];$('#moodOptions').innerHTML=moods.map((m,i)=>`<button class="mood-choice ${mood===i?'selected':''}" data-mood="${i}" aria-label="${m[0]}"><img src="${m[1]}" alt="${m[0]}"></button>`).join('');
 $$('#moodOptions button').forEach(b=>b.onclick=()=>{state.moods[todayKey()]=+b.dataset.mood;save();renderHome();toast('今日の気分を記録しました')});
 $('#moodSaved').textContent=mood===undefined?'気分を選んで記録できます。':`今日の気分：${moods[mood][0]}`;
}
function renderMeal(){let r=recipes[getDish()],p=dailyStats().pct,st=stages[currentStage(p)][0],si=currentStage(p);$('#mealDish').src=p===0?'onigiri.png':dishStageImage(r,si);$('#mealName').textContent=r[0];$('#mealStage').textContent=`${st} · 達成率 ${p}%`;$('#stageList').innerHTML=stages.map((s,i)=>`<div class="stage-item"><strong>${s[0]}</strong>${i===5?'100%':`${s[1]}〜${s[2]}%`}</div>`).join('')}
function renderRecipes(filter='all'){let unlock=unlockedCount();$('#recipeGrid').innerHTML=recipes.map((r,i)=>({r,i,ok:i<unlock})).filter(x=>filter==='all'||(filter==='unlocked'?x.ok:!x.ok)).map(x=>`<div class="recipe-card ${x.ok?'':'locked'}"><img src="${x.r[1]}" alt="${x.r[0]}"><span>${x.r[0]}</span></div>`).join('')}
function monthRate(){const [yy,mm]=monthKey().split('-').map(Number),days=new Date(yy,mm,0).getDate();let total=0,done=0;for(const t of state.tasks){if(t.hiddenFromList&&!(t.category==='deadline'&&t.completed))continue;if(t.category==='daily'){for(let d=1;d<=days;d++){const date=new Date(yy,mm-1,d),k=date.toLocaleDateString('sv-SE');if(!t.days?.length||t.days.includes(date.getDay())){total++;if(state.dailyDone[k]?.[t.id])done++}}}else if(t.category==='weekly'){let seen=new Set();for(let d=1;d<=days;d++){const k=weekKey(new Date(yy,mm-1,d));if(!seen.has(k)){seen.add(k);total++;if(state.weeklyDone[k]?.[t.id])done++}}}else if(t.category==='deadline'&&t.due?.startsWith(monthKey())){total++;if(t.completed)done++}}return total?Math.round(done/total*100):0}
function unlockedCount(){let p=monthRate();return p>=100?recipes.length:p>=90?10:p>=80?7:p>=60?4:3}
function renderRecords(){
 const p=monthRate();$('#monthLabel').textContent=monthKey().replace('-',' / ');$('#monthPct').textContent=p+'%';$('#monthBar').style.width=p+'%';
 $('#unlockList').innerHTML=[[60,'レシピを1種類追加解放'],[80,'レシピをさらに3種類解放'],[90,'特別レシピを解放'],[100,'すべてのレシピをコンプリート']].map(([v,l])=>`<div class="unlock-row"><span>${v}%　${l}</span><b>${p>=v?'✓':'—'}</b></div>`).join('');
 let d=new Date(),day=(d.getDay()+6)%7,start=new Date(d);start.setDate(d.getDate()-day);let labels=['月','火','水','木','金','土','日'];let vals=labels.map((_,i)=>{let x=new Date(start);x.setDate(start.getDate()+i);let k=x.toLocaleDateString('sv-SE');let arr=state.dailyDone[k]||{};let total=state.tasks.filter(t=>t.category==='daily'&&(!t.days?.length||t.days.includes(x.getDay()))).length;let done=Object.values(arr).filter(Boolean).length;return total?Math.round(done/total*100):0});
 $('#weekLabel').textContent=`${start.getMonth()+1}/${start.getDate()} 〜 ${d.getMonth()+1}/${d.getDate()}`;$('#weekChart').innerHTML=labels.map((l,i)=>`<div class="day-bar ${i===day?'today':''}"><div class="day-bar-fill" style="height:${Math.max(3,vals[i])}%"></div><span>${l}</span></div>`).join('');$('#weekSummary').textContent=`今週のDAILY ROUTINE平均：${Math.round(vals.reduce((a,b)=>a+b,0)/7)}%`;
 let hist=Array.from({length:7},(_,i)=>{let x=new Date();x.setDate(x.getDate()-(6-i));let k=x.toLocaleDateString('sv-SE');return {k,d:x.getDate(),m:state.moods[k]}});$('#moodHistory').innerHTML=hist.map(x=>`<div class="history-day">${x.d}<img src="${x.m===undefined?'mood_2.png':moods[x.m][1]}" alt="">${x.m===undefined?'—':moods[x.m][0]}</div>`).join('');
 const archived=state.tasks.filter(t=>t.hiddenFromList);const byDate={};archived.forEach(t=>{const k=t.hiddenAt||t.completedAt||'日付不明';(byDate[k]??=[]).push(t)});$('#completedTasks').innerHTML=Object.keys(byDate).sort((a,b)=>b.localeCompare(a)).map(k=>`<div class="archive-date">${k}</div>${byDate[k].map(t=>`<div class="archive-row"><div class="archive-task-copy"><span>${isDone(t)?'✓':'○'} ${esc(t.name)}</span><small>${groupLabel(t.category)}${isDone(t)?' · 完了':' · 未完了'}</small></div><div class="archive-actions"><button class="restore-task" data-action="restore" data-id="${t.id}">戻す</button><button class="delete-task" data-action="delete" data-id="${t.id}">削除</button></div></div>`).join('')}`).join('')||'<div class="empty-state">アーカイブしたタスクはありません。</div>';
 $$('#completedTasks [data-action]').forEach(b=>b.onclick=()=>{const t=state.tasks.find(x=>x.id===b.dataset.id);if(!t)return;if(b.dataset.action==='restore'){t.hiddenFromList=false;t.hiddenAt=null;save();render();toast('HOMEに戻しました')}else if(confirm(`「${t.name}」を完全に削除しますか？この操作は取り消せません。`)){state.tasks=state.tasks.filter(x=>x.id!==t.id);save();render();toast('完全に削除しました')}});
}

let longPressTimer=null;
function startTaskLongPress(e,t){if(e.pointerType==='mouse')return;cancelTaskLongPress();longPressTimer=setTimeout(()=>openTaskActions(t),550)}
function cancelTaskLongPress(){if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null}}
let dragState=null,dragHoldTimer=null;
function attachDrag(row,t){const handle=row.querySelector('.drag-handle');handle.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();if(dragHoldTimer)clearTimeout(dragHoldTimer);dragHoldTimer=setTimeout(()=>{dragState={row,id:t.id,category:t.category,moved:false};row.classList.add('dragging');document.body.classList.add('is-reordering');},280)};}
document.addEventListener('pointermove',e=>{if(!dragState)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.task-row');if(!target||target===dragState.row||target.dataset.category!==dragState.category)return;const rect=target.getBoundingClientRect();const after=e.clientY>rect.top+rect.height/2;target.parentNode.insertBefore(dragState.row,after?target.nextSibling:target);dragState.moved=true;});
document.addEventListener('pointerup',()=>{if(dragHoldTimer){clearTimeout(dragHoldTimer);dragHoldTimer=null}if(!dragState)return;const category=dragState.category;const rows=$$(`#homeTasks .task-row[data-category="${category}"]`);rows.forEach((r,i)=>{const t=state.tasks.find(x=>x.id===r.dataset.id);if(t)t.order=i});save();dragState.row.classList.remove('dragging');document.body.classList.remove('is-reordering');if(dragState.moved)toast('順番を変更しました');dragState=null;});
document.addEventListener('pointercancel',()=>{if(dragHoldTimer){clearTimeout(dragHoldTimer);dragHoldTimer=null}if(dragState){dragState.row.classList.remove('dragging');document.body.classList.remove('is-reordering');dragState=null}});

function render(){renderHome();renderMeal();renderRecords();renderRecipes($('.filter.active')?.dataset.filter||'all');}
function showPage(id){$$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+id));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===id));window.scrollTo(0,0)}
$$('.nav-item').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$('#todayDate').textContent=dateLabel();
$('#changeDish').onclick=$('#mealChange').onclick=()=>{let prev=getDish(),pool=recipes.map((_,i)=>i).filter(i=>i<unlockedCount()&&i!==prev);if(!pool.length)pool=[0];state.dishByDay[todayKey()]=pool[Math.floor(Math.random()*pool.length)];save();render();toast('今日のごはんを変更しました')};
$$('.filter').forEach(b=>b.onclick=()=>{$$('.filter').forEach(x=>x.classList.toggle('active',x===b));renderRecipes(b.dataset.filter)});
const dlg=$('#taskDialog'), weekdays=['日','月','火','水','木','金','土'];
$('#weekdayPicks').innerHTML=weekdays.map((d,i)=>`<label><input type="checkbox" value="${i}" ${[1,2,3,4,5].includes(i)?'checked':''}><span>${d}</span></label>`).join('');
function updateFields(){let c=$('#taskCategory').value;$('#dailyFields').hidden=c!=='daily';$('#deadlineFields').hidden=c!=='deadline'}
$('#taskCategory').onchange=updateFields;
function openTask(t=null){$('#taskForm').dataset.id=t?.id||'';$('#dialogTitle').textContent=t?'タスクを編集':'タスクを追加';$('#taskName').value=t?.name||'';$('#taskCategory').value=t?.category||'daily';$('#taskDue').value=t?.due||'';$$('#weekdayPicks input').forEach(x=>x.checked=t?.days?t.days.includes(+x.value):[1,2,3,4,5].includes(+x.value));$('#deleteTask').hidden=!t;updateFields();dlg.showModal()}
$('#addTask').onclick=()=>openTask();$('#closeDialog').onclick=()=>dlg.close();
$('#taskForm').onsubmit=e=>{e.preventDefault();let name=$('#taskName').value.trim();if(!name)return;let c=$('#taskCategory').value;let t=state.tasks.find(x=>x.id===$('#taskForm').dataset.id);let data={id:t?.id||id(),name,category:c,days:c==='daily'?$$('#weekdayPicks input:checked').map(x=>+x.value):[],due:c==='deadline'?$('#taskDue').value:'',order:t?.order??state.tasks.length};if(t)Object.assign(t,data);else state.tasks.push(data);save();dlg.close();render();toast(t?'タスクを更新しました':'タスクを追加しました')};
$('#deleteTask').onclick=()=>{let t=state.tasks.find(x=>x.id===$('#taskForm').dataset.id);if(!t)return;if(confirm(`「${t.name}」を削除しますか？`)){state.tasks=state.tasks.filter(x=>x.id!==t.id);save();dlg.close();render();toast('削除しました')}};
$('#exportData').onclick=()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`my-little-days-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href)};
$('#importData').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let x=JSON.parse(await f.text());if(!x||!Array.isArray(x.tasks))throw Error();if(confirm('現在のデータを読み込んだ内容で上書きします。よろしいですか？')){state={...defaultState(),...x};save();render();toast('バックアップを復元しました')}}catch{alert('JSONファイルを読み込めませんでした')}e.target.value=''};
if('serviceWorker'in navigator && location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
})();