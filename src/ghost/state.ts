import { BEHAVIOUR } from "./config";
import { TAU } from "./math";
import type { EyeWeights } from "./eyes";
export type View = { W: number; H: number; DPR: number; U: number; CX: number; CY: number };
export type Pointer = { x: number; y: number; px: number; py: number; present: boolean; down: boolean; touch: boolean; lastMove: number; spd: number };
export type Ghost = { x:number;y:number;vx:number;vy:number;gx:number;gy:number;gvx:number;gvy:number;lean:number;lv:number;sq:number;sqv:number;happy:number;surp:number;press:number;sleep:number;woke:boolean;blink:number;blinkT:number;nextBlink:number;phase:number;glow:number;lift:number;liftv:number;trailX:number;trailY:number;hover:boolean };
export type Particle = { x:number;y:number;vx:number;vy:number;t:number;life:number;s:number;c:string;rot:number;vr:number;star:boolean };
export type Ripple = { x:number;y:number;t:number;big:boolean };
export type Snore = { x:number;y:number;t:number };
export type Dust = { x:number;y:number;r:number;s:number;p:number };
export type World = { ctx:CanvasRenderingContext2D;view:View;pattern:HTMLCanvasElement|null;pointer:Pointer;ghost:Ghost;parts:Particle[];rips:Ripple[];zz:Snore[];dust:Dust[];eyeW:EyeWeights;eyeV:EyeWeights;t:number;path:Path2D|null;reducedMotion:boolean };
const weights = (): EyeWeights => ({ happy:0,press:0,surprise:0,sleep:0,closed:0 });
export function createWorld(ctx:CanvasRenderingContext2D,view:View):World {
 const {W,H,CX,CY}=view;
 return {ctx,view,pattern:null,pointer:{x:W*.75,y:H*.8,px:0,py:0,present:false,down:false,touch:false,lastMove:0,spd:0},ghost:{x:CX,y:CY,vx:0,vy:0,gx:0,gy:0,gvx:0,gvy:0,lean:0,lv:0,sq:0,sqv:0,happy:0,surp:0,press:0,sleep:0,woke:false,blink:0,blinkT:-1,nextBlink:BEHAVIOUR.firstBlink,phase:0,glow:0,lift:0,liftv:0,trailX:0,trailY:0,hover:false},parts:[],rips:[],zz:[],dust:[...Array(BEHAVIOUR.dustCount)].map(()=>({x:Math.random(),y:Math.random(),r:.5+Math.random()*1.6,s:.2+Math.random()*.8,p:Math.random()*TAU})),eyeW:weights(),eyeV:weights(),t:0,path:null,reducedMotion:false};
}
