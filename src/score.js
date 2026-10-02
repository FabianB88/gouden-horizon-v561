// Original slow modal harmony, written for Gouden Horizon. No sampled music.
export function scoreStep(zone,step,tension=0){
 const roots=[146.83,130.81,164.81,174.61],root=roots[Math.max(0,Math.min(3,zone))],notes=[];
 const chords=[[1,1.2,1.5],[4/3,1.6,2],[1.2,1.5,1.8],[1,1.25,1.5]],chord=chords[Math.floor(step/8)%4];
 if(step%8===0)for(const ratio of chord)notes.push({frequency:root*ratio,duration:7.8,kind:'pad',volume:.035});
 const melody=[2,0,1.5,0,1.8,0,1.5,0,1.6,0,2,0,2.4,0,2,0,1.8,0,1.5,0,1.2,0,1.5,0,2,0,1.5,0,1.25,0,1,0];
 if(melody[step%32])notes.push({frequency:root*melody[step%32],duration:3.6,kind:'bell',volume:.027});
 if(step%8===0)notes.push({frequency:root*.5,duration:7.2,kind:'pad',volume:.026});
 if(tension>.15&&step%2===0)notes.push({frequency:root*.25,duration:.55,kind:'pulse',volume:.018*Math.min(1,tension)});
 return notes;
}
