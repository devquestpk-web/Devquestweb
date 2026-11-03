import { createSign } from "node:crypto";
import { getSupabaseAdminClient } from "./supabase-admin";

const tokenEndpoint = "https://oauth2.googleapis.com/token";
const calendarScope = "https://www.googleapis.com/auth/calendar";
const meetScope = "https://www.googleapis.com/auth/meetings.space.readonly";
function base64url(value:string|Buffer){return Buffer.from(value).toString("base64url");}

async function workspaceToken(scopes:string[]){
  const clientId=process.env.GOOGLE_WORKSPACE_CLIENT_ID,clientSecret=process.env.GOOGLE_WORKSPACE_CLIENT_SECRET,refreshToken=process.env.GOOGLE_WORKSPACE_REFRESH_TOKEN;
  if(clientId&&clientSecret&&refreshToken){const response=await fetch(tokenEndpoint,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:"refresh_token"}),cache:"no-store"});const result=await response.json() as {access_token?:string;error_description?:string};if(!response.ok||!result.access_token)throw new Error(result.error_description||"Google Workspace OAuth failed");return result.access_token;}
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g,"\n"),subject=process.env.GOOGLE_WORKSPACE_IMPERSONATED_USER;
  if(!email||!privateKey||!subject)throw new Error("Google Workspace user authorization is not configured");
  const now=Math.floor(Date.now()/1000),header=base64url(JSON.stringify({alg:"RS256",typ:"JWT"})),claims=base64url(JSON.stringify({iss:email,sub:subject,scope:scopes.join(" "),aud:tokenEndpoint,iat:now,exp:now+3600})),unsigned=`${header}.${claims}`,signer=createSign("RSA-SHA256");signer.update(unsigned);const assertion=`${unsigned}.${signer.sign(privateKey,"base64url")}`;
  const response=await fetch(tokenEndpoint,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}),cache:"no-store"});const result=await response.json() as {access_token?:string;error_description?:string};if(!response.ok||!result.access_token)throw new Error(result.error_description||"Google Workspace delegated authorization failed");return result.access_token;
}

async function googleRequest(url:string,token:string,init?:RequestInit){const response=await fetch(url,{...init,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",...init?.headers},cache:"no-store"});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(`Google API ${response.status}: ${JSON.stringify(body).slice(0,600)}`);return body;}

export async function googleWorkspaceCapabilities(){
  const calendarId=process.env.GOOGLE_CALENDAR_ID;
  if(!calendarId)return {configured:false,calendar:false,meetReports:false,reason:"GOOGLE_CALENDAR_ID is not configured"};
  try{const token=await workspaceToken([calendarScope,meetScope]);const calendar=await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,token) as {conferenceProperties?:{allowedConferenceSolutionTypes?:string[]}};let meetReports=true;try{await googleRequest("https://meet.googleapis.com/v2/conferenceRecords?pageSize=1",token);}catch{meetReports=false;}return {configured:true,calendar:true,meetCreation:calendar.conferenceProperties?.allowedConferenceSolutionTypes?.includes("hangoutsMeet")||false,meetReports};}catch(error){return {configured:true,calendar:false,meetCreation:false,meetReports:false,reason:error instanceof Error?error.message:"Google capability check failed"};}
}

type SessionForGoogle={id:string;title:string;topic?:string|null;starts_at:string;ends_at:string;google_calendar_event_id?:string|null};
export async function createGoogleCalendarMeet(session:SessionForGoogle){
  const calendarId=process.env.GOOGLE_CALENDAR_ID;if(!calendarId)throw new Error("GOOGLE_CALENDAR_ID is not configured");const token=await workspaceToken([calendarScope]);
  const body={id:session.id.replaceAll("-","").toLowerCase(),summary:session.title,description:session.topic||"DevQuest PK session",start:{dateTime:new Date(session.starts_at).toISOString(),timeZone:"Asia/Karachi"},end:{dateTime:new Date(session.ends_at).toISOString(),timeZone:"Asia/Karachi"},conferenceData:{createRequest:{requestId:crypto.randomUUID(),conferenceSolutionKey:{type:"hangoutsMeet"}}}};
  const method=session.google_calendar_event_id?"PUT":"POST",eventId=session.google_calendar_event_id||body.id,url=`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${method==="PUT"?`/${encodeURIComponent(eventId)}`:""}?conferenceDataVersion=1&sendUpdates=none`;
  return googleRequest(url,token,{method,body:JSON.stringify(body)}) as Promise<{id:string;hangoutLink?:string;conferenceData?:{conferenceId?:string;entryPoints?:Array<{entryPointType?:string;uri?:string}>}}>;
}

type MeetParticipant={name:string;signedinUser?:{user?:string;displayName?:string};anonymousUser?:{displayName?:string};phoneUser?:{displayName?:string}};
export async function syncMeetParticipation(sessionId:string){
  const supabase=getSupabaseAdminClient();const{data:session,error}=await supabase.from("event_sessions").select("id, google_meet_code, join_url").eq("id",sessionId).single();if(error||!session)throw new Error("Session not found");
  const code=session.google_meet_code||session.join_url?.match(/meet\.google\.com\/([a-z-]+)/i)?.[1];if(!code)throw new Error("This session has no Google Meet code");const token=await workspaceToken([meetScope]);
  const records=await googleRequest(`https://meet.googleapis.com/v2/conferenceRecords?pageSize=10&filter=${encodeURIComponent(`space.meeting_code = "${code}"`)}`,token) as {conferenceRecords?:Array<{name:string;startTime?:string;endTime?:string}>};const record=records.conferenceRecords?.[0];if(!record)throw new Error("No Meet conference record is available yet");
  const participantResponse=await googleRequest(`https://meet.googleapis.com/v2/${record.name}/participants?pageSize=250`,token) as {participants?:MeetParticipant[]};let imported=0,matched=0;
  for(const participant of participantResponse.participants||[]){const sessions=await googleRequest(`https://meet.googleapis.com/v2/${participant.name}/participantSessions?pageSize=250`,token) as {participantSessions?:Array<{startTime?:string;endTime?:string}>};const activity=sessions.participantSessions||[],starts=activity.map(item=>item.startTime).filter(Boolean) as string[],ends=activity.map(item=>item.endTime).filter(Boolean) as string[],duration=activity.reduce((total,item)=>total+(item.startTime&&item.endTime?Math.max(0,(new Date(item.endTime).getTime()-new Date(item.startTime).getTime())/1000):0),0);const googleUser=participant.signedinUser?.user||null;let userId:string|null=null;if(googleUser){const{data:profile}=await supabase.from("profiles").select("id").eq("google_user_resource",googleUser).maybeSingle();userId=profile?.id||null;}
    const participantType=participant.signedinUser?"signed_in":participant.anonymousUser?"anonymous":participant.phoneUser?"phone":"unknown",displayName=participant.signedinUser?.displayName||participant.anonymousUser?.displayName||participant.phoneUser?.displayName||null;
    const{data:saved}=await supabase.from("meet_participant_records").upsert({session_id:sessionId,conference_record:record.name,participant_resource:participant.name,google_user_resource:googleUser,display_name:displayName,participant_type:participantType,first_join_at:starts.sort()[0]||null,last_leave_at:ends.sort().at(-1)||null,duration_seconds:Math.round(duration),matched_user_id:userId,match_status:userId?"matched":"unmatched",raw_data:{participant,activity},updated_at:new Date().toISOString()},{onConflict:"session_id,participant_resource"}).select("id").single();imported++;
    if(userId){const{data:enrollment}=await supabase.from("session_enrollments").select("id").eq("session_id",sessionId).eq("user_id",userId).eq("status","enrolled").maybeSingle();if(enrollment){await supabase.from("session_attendance").upsert({session_id:sessionId,user_id:userId,status:"present",checked_in_at:starts.sort()[0]||null,source:"google_meet",source_reference:saved?.id||participant.name,updated_at:new Date().toISOString()},{onConflict:"session_id,user_id"});matched++;}}}
  await supabase.from("event_sessions").update({google_conference_record:record.name,google_sync_status:"completed",google_sync_error:null,updated_at:new Date().toISOString()}).eq("id",sessionId);return{conferenceRecord:record.name,imported,matched,unmatched:imported-matched};
}
