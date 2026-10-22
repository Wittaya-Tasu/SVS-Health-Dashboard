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
  createEnabled:state.settings?.knowledgeSharingCreateProtocol===1,
  createRecord:params=>api('knowledgeSharing',params),
  actorName:state.user.name,
  editEnabled:state.settings?.knowledgeSharingEditProtocol===1&&state.settings?.knowledgeSharingDetailsProtocol===3,
  saveRecord:params=>api('knowledgeSharing',params),
  validateRecord:params=>api('knowledgeSharing',params),
  mediaEnabled:state.settings?.knowledgeSharingMediaProtocol===3,
  uploadPhoto:params=>api('knowledgeSharing',{op:'uploadPhoto',...params}),
  readPhoto:params=>api('knowledgeSharing',{op:'readPhoto',...params}),
  exportReport:async(format,snapshot,includeHistory)=>{
   const filters={...snapshot.selection,description:snapshot.filters,content:includeHistory?'dashboard-and-history':'dashboard',recordCount:snapshot.rows.length};
   const metadata=await api('prepareExport016',{report:'knowledgeSharing',format,filters});
   if(!metadata?.id||!metadata?.actorId||!metadata?.at)throw Error('ไม่พบข้อมูลกำกับการส่งออก');
   if(includeHistory){snapshot.photoImages={};for(const record of snapshot.rows)for(const photoId of record.photoIds||[]){if(snapshot.photoImages[photoId])continue;const photo=await api('knowledgeSharing',{op:'readPhoto',recordId:record.id,photoId,variant:'report'});snapshot.photoImages[photoId]='data:'+photo.mime+';base64,'+photo.base64;}}
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
