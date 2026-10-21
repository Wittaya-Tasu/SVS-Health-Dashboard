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
