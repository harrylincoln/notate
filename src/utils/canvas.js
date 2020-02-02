import { staves } from './notation-rules'; 

export const drawNotes = (notesArr, ctx, maxAmountNoteValue) => {
    notesArr.forEach((note) => {
      const denomination = (maxAmountNoteValue / note.activeNoteLength);
      
      // base
      ctx.beginPath();
      ctx.ellipse(note.closestBeatX, note.lineY, note.baseNoteSize, ((note.baseNoteSize / 2) * 3), Math.PI / 3, 0, 2 * Math.PI);
      if(denomination <= 2) { // fill or not, based on length
        ctx.stroke();
      } else {
        ctx.fill();
      }
      ctx.closePath();

      // accidentals
      if(note.accidentalOverride) {
        ctx.beginPath();
          const flatScale = 8; // increase when more flags
          const accPosX = (note.closestBeatX - (flatScale * 7)) + note.baseNoteSize;
          const accPosYStart = note.lineY;
          const accPosYEnd = accPosYStart - (note.baseNoteSize);
        switch (note.accidentalOverride) {
          case 'flat':
              ctx.moveTo(accPosX - 7, accPosYStart);
              ctx.lineTo(accPosX - 7, accPosYEnd);
              ctx.stroke();
              ctx.moveTo(accPosX, accPosYStart);
              ctx.ellipse(accPosX, accPosYStart, (note.baseNoteSize / flatScale), (note.baseNoteSize / 3), Math.PI / 3, 0, 2 * Math.PI);
              ctx.stroke();
            break;
          case 'sharp':
              ctx.moveTo(accPosX - 7, accPosYStart);
              ctx.lineTo(accPosX - 3, accPosYEnd);

              ctx.moveTo(accPosX - 0, accPosYStart);
              ctx.lineTo(accPosX + 4, accPosYEnd);

              ctx.moveTo(accPosX - 12 , accPosYStart - 6);
              ctx.lineTo(accPosX + 10, accPosYEnd + 10);

              ctx.moveTo(accPosX - 10 , accPosYStart - 12);
              ctx.lineTo(accPosX + 10, accPosYEnd + 4);
              
              ctx.stroke();
            break;
          case 'natural':
              ctx.moveTo(accPosX - 7, accPosYStart);
              ctx.lineTo(accPosX - 7, accPosYEnd);

              ctx.moveTo(accPosX - 7, accPosYStart - 10);
              ctx.lineTo(accPosX, accPosYEnd + 15);

              ctx.moveTo(accPosX, accPosYStart - 3);
              ctx.lineTo(accPosX, accPosYEnd + 32);

              ctx.moveTo(accPosX - 7, accPosYStart);
              ctx.lineTo(accPosX, accPosYEnd + 25);

          
            ctx.stroke();
          break;
          default:
            break;
        }
        ctx.closePath();
      }
      
      // stems & flags
      if(denomination > 1) {
        const stemScale = 6; // increase when more flags
        const stemPosX = (note.closestBeatX + stemScale) + note.baseNoteSize;
        const stemPosYStart = note.lineY;
        const stemPosYEnd = stemPosYStart - (note.baseNoteSize * stemScale);

        ctx.beginPath();
        ctx.moveTo(stemPosX, stemPosYStart);
        ctx.lineTo(stemPosX, stemPosYEnd);
        ctx.stroke();
        ctx.closePath();
      
        if(denomination >= 8) {
          // flags
          // Define the points as {x, y}

          const flagPosAndScaleX = val => ((val * stemScale) + (stemPosX - (note.baseNoteSize * 2)));
          const flagPosAndScaleY = val => ((val * stemScale) + stemPosYEnd);

          const start1 = { x: flagPosAndScaleX(6),  y: flagPosAndScaleY(1) };
          const cp1 =    { x: flagPosAndScaleX(7),  y: flagPosAndScaleY(4) };
          const cp2 =    { x: flagPosAndScaleX(8),  y: flagPosAndScaleY(5) };
          const end1 =   { x: flagPosAndScaleX(10), y: flagPosAndScaleY(6) };

          const cp3 =    { x: flagPosAndScaleX(13), y: flagPosAndScaleY(7) };
          const cp4 =    { x: flagPosAndScaleX(14), y: flagPosAndScaleY(16) };
          const end2 =   { x: flagPosAndScaleX(10), y: flagPosAndScaleY(17) };

          const cp5 =   { x: flagPosAndScaleX(16),  y: flagPosAndScaleY(3) };
          const cp6 =   { x: flagPosAndScaleX(6),   y: flagPosAndScaleY(7) };
          const end3 =  { x: flagPosAndScaleX(6),   y: flagPosAndScaleY(7) };

          // Draw stages of flag
          ctx.beginPath();
          ctx.moveTo(start1.x, start1.y);
          ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end1.x, end1.y);
          // ctx.moveTo(end1.x, end1.y);
          ctx.bezierCurveTo(cp3.x, cp3.y, cp4.x, cp4.y, end2.x, end2.y);
          // ctx.moveTo(end2.x, end2.y);
          ctx.bezierCurveTo(cp5.x, cp5.y, cp6.x, cp6.y, end3.x, end3.y);
          // ctx.moveTo(end3.x, end3.y);
          ctx.lineTo(end3.x, start1.y);
          ctx.fill(); 
        }
      }

      // draw ledger(s)
      if(note.closestStave.ledger) {
        note.closestStave.ledger.forEach(val => {
          if(val === 0) {
            ctx.moveTo((note.closestBeatX - (note.baseNoteSize * 2)), note.closestStave.y0);
            ctx.lineTo((note.closestBeatX + (note.baseNoteSize * 2)), note.closestStave.y0);
          } else {
            ctx.moveTo((note.closestBeatX - (note.baseNoteSize * 2)), (note.closestStave.y0 - (note.baseNoteSize * val)));
            ctx.lineTo((note.closestBeatX + (note.baseNoteSize * 2)), (note.closestStave.y0 - (note.baseNoteSize * val)));
          }
          ctx.stroke();
        });
      }
    });
  };

  export const drawStaves = ctx => {
    ctx.beginPath();
    staves.map.filter(x => x.draw).forEach(stave => {
      ctx.moveTo(stave.x0,stave.y0);
      ctx.lineTo(stave.x1,stave.y1);
    });
    ctx.stroke();
  };

  export const linepointNearestMouse = (stave, x, y) => {
    const lerp = (a,b,z) => (a+z*(b-a));
    const dx = stave.x1-stave.x0;
    const dy = stave.y1-stave.y0;
    
    const t=((x-stave.x0)*dx+(y-stave.y0)*dy)/(dx*dx+dy*dy);
    const lineY=lerp(stave.y0, stave.y1, t);

    return({y:lineY});
  };
