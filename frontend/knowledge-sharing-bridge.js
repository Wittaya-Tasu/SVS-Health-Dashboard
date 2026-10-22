'use strict';
// The current server must advertise the corresponding read/import capability.
let knowledgeSharingView=null;
function openKnowledgeSharingMember(member){
 if(!state.user)return;
 if(knowledgeSharingView)knowledgeSharingView.dispose();
 knowledgeSharingView=SVSKnowledgeUI.mount(document.getElementById('app'),{
  member:member?{name:member.name,position:member.position,userId:member.userId||null}:null,
  enabled:state.settings?.knowledgeSharingProtocol===1,
  loadData:()=>api('knowledgeSharing',{op:'read'}),
  editEnabled:state.settings?.knowledgeSharingEditProtocol===1,
  saveRecord:params=>api('knowledgeSharing',params),
  exportReport:async(format,snapshot,includeHistory)=>{
   const filters={...snapshot.selection,description:snapshot.filters,content:includeHistory?'dashboard-and-history':'dashboard',recordCount:snapshot.rows.length};
   const metadata=await api('prepareExport016',{report:'knowledgeSharing',format,filters});
   if(!metadata?.id||!metadata?.actorId||!metadata?.at)throw Error('ไม่พบข้อมูลกำกับการส่งออก');
   const canvases=await SVSKnowledgeExport.generate(snapshot,includeHistory),attributed=canvases.map(c=>attributedCanvas016(c,metadata));
   await SVSKnowledgeExport.download(attributed,format,{pdf:overviewPdf,name:`SVS_Knowledge_Sharing_${today()}_${metadata.id}.${format}`});
  },
  onImport:state.user.role==='Admin'&&state.settings?.knowledgeSharingImportProtocol===1?openKnowledgeSharingImport:undefined,
  onBack:()=>{knowledgeSharingView=null;render();}
 });
}
function openKnowledgeSharingImport(){
 if(!state.user||state.user.role!=='Admin'||state.settings?.knowledgeSharingImportProtocol!==1)return;
 if(knowledgeSharingView)knowledgeSharingView.dispose();knowledgeSharingView=null;
 SVSKnowledgeImport.mount(document.getElementById('app'),{
  api:params=>api('knowledgeSharing',params),onBack:()=>openKnowledgeSharingMember(),
  onApplied:()=>{state.settings.knowledgeSharingProtocol=1;openKnowledgeSharingMember();}
 });
}
