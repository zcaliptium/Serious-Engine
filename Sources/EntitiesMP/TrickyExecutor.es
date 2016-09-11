/* Copyright (c) 2002-2012 Croteam Ltd. 
This program is free software; you can redistribute it and/or modify
it under the terms of version 2 of the GNU General Public License as published by
the Free Software Foundation


This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA. */

229
%{
  #include "StdH.h"
  #include "EntitiesMP/Player.h"
%}

class CTrickyExecutor: CRationalEntity {
name      "TrickyExecutor";
thumbnail "Thumbnails\\TrickyExecutor.tbn";
features  "HasName", "IsTargetable";

properties:
   1 CTString m_strName "Name" 'N'      = "Tricky Executor",
   3 CTString m_strDescription = "",
   
   4 BOOL m_bActive              "Active" 'A' = TRUE,
   5 BOOL m_bDebugMessages "Debug Messages" = FALSE,
   6 BOOL m_bDontIfNoEntity "Don't Trick If No Entity" = FALSE,

  10 CEntityPointer m_penEnityToTrick "Entity To Trick" 'E' COLOR(C_YELLOW|0xFF),
  11 CEntityPointer m_penTarget       "Target" 'T',

components:
  1 model   MODEL_TELEPORTER   "Models\\Editor\\TrickyExecutor.mdl",
  2 texture TEXTURE_TELEPORTER "Models\\Editor\\TrickyExecutor.tex",

functions:
  const CTString &GetDescription(void) const {
    return m_strDescription;
  }

  void DoExecution() {
    if (m_bDontIfNoEntity && m_penEnityToTrick == NULL) {
      return;
    }

    if (m_penTarget == NULL) {
      CPrintF("%s : No target entity!\n", GetName());
      return;
    }

    CPrintF("%s : Sending event from %s.\n", GetName(), m_penEnityToTrick->GetName());
    SendToTarget(m_penTarget, EET_TRIGGER, m_penEnityToTrick);
  }

procedures:
  Main()
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_TELEPORTER);
    SetModelMainTexture(TEXTURE_TELEPORTER);
  
    autowait(0.1f);
  
    wait() {
      on (EBegin) : { 
        resume;
      }

      on(ETrigger) : {
        if (m_bActive) {
          DoExecution();
        }

        resume;
      }

      on (EActivate) : {
        m_bActive = TRUE;
        resume;
      }

      on (EDeactivate) : {
        m_bActive = FALSE;
        resume;
      }
    }
  }
};
