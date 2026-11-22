import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/netlify-db';
import { eq } from 'drizzle-orm';
import { wateringSchedules } from '../../db/schema';
const db=drizzle();
export const config={path:'/api/watering-schedules'};
export default async function(request:Request){
  const headers:Record<string,string>={'Cache-Control':'no-store'};
  if(!['GET','PUT'].includes(request.method))return new Response('Method not allowed',{status:405});
  if(request.method==='PUT'&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
  let browserId=request.headers.get('cookie')?.match(/(?:^|;\s*)bloom_browser=([a-f0-9-]{36})(?:;|$)/)?.[1];
  if(!browserId){browserId=randomUUID();headers['Set-Cookie']=`bloom_browser=${browserId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`;}
  try{
    if(request.method==='GET'){
      const rows=await db.select({plantId:wateringSchedules.plantId,date:wateringSchedules.date,time:wateringSchedules.time,interval:wateringSchedules.interval}).from(wateringSchedules).where(eq(wateringSchedules.browserId,browserId));
      return Response.json(rows,{headers});
    }
    const body=await request.text();if(body.length>2000)return new Response('Too large',{status:413});
    const {plantId,date,time,interval}=JSON.parse(body);
    const parsed=new Date(date+'T12:00:00Z');
    if(typeof plantId!=='string'||!/^\d{1,16}$/.test(plantId)||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!Number.isInteger(interval)||interval<1||interval>60)return new Response('Invalid schedule',{status:400});
    await db.insert(wateringSchedules).values({browserId,plantId,date,time,interval}).onConflictDoUpdate({target:[wateringSchedules.browserId,wateringSchedules.plantId],set:{date,time,interval}});
    return Response.json({plantId,date,time,interval},{headers});
  }catch{return Response.json({error:'Could not load or save watering reminders. Please try again.'},{status:503,headers});}
}
