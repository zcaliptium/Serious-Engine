/* Copyright (c) 2018 by ZCaliptium.

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

6590
%{
  #include "StdH.h"
  #include "Entities/WorldSettingsController.h"
  #include "Entities/BackgroundViewer.h"
%}

class CHudPicDisplay : CRationalEntity {
name      "CHudPicDisplay";
thumbnail "Thumbnails\\HudPicDisplay.tbn";
features  "IsTargetable", "HasName", "IsImportant";

properties:

  1 CTString m_strName "Name" 'N' = "Hud Pic Display",
  2 CTString m_strDescription = "",
  3 CTFileName m_fnmPicture "Picture File" 'P' = CTString("") features(EPROPF_READONLY),
  4 FLOAT m_tmFadeInStart = 1e6,
  5 FLOAT m_tmFadeOutStart = 1e6,
  6 FLOAT m_tmFadeInLen "Fade in time" 'I' = 0.5f,
  7 FLOAT m_tmFadeOutLen "Fade out time" 'O' = 0.5f,
  8 FLOAT m_tmAutoFadeOut "Auto fade out time" 'A' = -1.0f,
  9 FLOAT m_fYRatio "Pos Y Ratio" 'Y' = 0.5f,
 10 FLOAT m_fXRatio "Pos X Ratio" 'X' = 0.5f,
 11 FLOAT m_fPictureStretch "Picture stretch" 'S' = 1.0f,
 
 15 BOOL m_bFullScreen		"Fullscreen" = FALSE,
 16 BOOL m_bOverWeapon    "Over Weapon" = FALSE,

 20 CModelObject m_moTextureHolder, 

components:
  1 model   MODEL_MARKER     "Models\\Editor\\HudPicDisplay.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\HudPicDisplay.tex"

functions:
  // --------------------------------------------------------------------------------------
  // Returns short entity description to show it in SED.
  // --------------------------------------------------------------------------------------
  const CTString &GetDescription(void) const
  {
    ((CTString&)m_strDescription).PrintF("%s", m_fnmPicture.FileName());
    return m_strDescription;
  }
  
  // --------------------------------------------------------------------------------------
  // Render credits to given drawport.
  // --------------------------------------------------------------------------------------
  FLOAT HudPic_Render(CDrawPort *pdp)
  {
    if (m_fnmPicture == "") { return 0; }

    FLOAT fNow=_pTimer->CurrentTick();

    if( fNow < m_tmFadeInStart) { return 0; }
    if( fNow > m_tmFadeOutStart + m_tmFadeOutLen) { return 0;}

    CTextureObject *pto = &m_moTextureHolder.mo_toTexture;
    CTextureData *ptd = (CTextureData*)pto->GetData();
    
    if (ptd == NULL) { return 0; }

    CDrawPort *pdpCurr = pdp;
    pdp->Unlock();
    pdpCurr->Lock();
    
    FLOAT fRatio=1.0f;

    if (fNow > m_tmFadeOutStart)
    {
      fRatio = CalculateRatio(fNow, m_tmFadeOutStart, m_tmFadeOutStart+m_tmFadeOutLen, 0, 1);
    }

    if (fNow < m_tmFadeInStart+m_tmFadeInLen)
    {
      fRatio = CalculateRatio(fNow, m_tmFadeInStart, m_tmFadeInStart+m_tmFadeInLen, 1, 0);
    }

    UBYTE ubA = ClampUp(UBYTE(fRatio*255.0f), UBYTE(255));
    
    FLOAT fResScale = (FLOAT)pdpCurr->GetHeight() / 480.0f;
    const MEX mexTexW = ptd->GetWidth();
    const MEX mexTexH = ptd->GetHeight();
    FLOAT fPicRatioW, fPicRatioH;

    if( mexTexW > mexTexH) {
      fPicRatioW = mexTexW/mexTexH;
      fPicRatioH = 1.0f;
    } else {
      fPicRatioW = 1.0f;
      fPicRatioH = mexTexH/mexTexW;
    }

    PIX picW = 128*m_fPictureStretch*fResScale*fPicRatioW;
    PIX picH = 128*m_fPictureStretch*fResScale*fPicRatioH;

    PIXaabbox2D boxScr;

    if (m_bFullScreen) {
      boxScr = PIXaabbox2D(
        PIX2D(0, 0),
        PIX2D(pdpCurr->GetWidth(), pdpCurr->GetHeight()) );

    } else {
      FLOAT fXCenter = m_fXRatio * pdpCurr->GetWidth();
      FLOAT fYCenter = m_fYRatio * pdpCurr->GetHeight();

      boxScr = PIXaabbox2D(
        PIX2D(fXCenter - picW/2, fYCenter - picH/2),
        PIX2D(fXCenter + picW/2, fYCenter + picH/2) );
    }

    pdpCurr->PutTexture(pto, boxScr, C_WHITE|ubA);

    pdpCurr->Unlock();
    pdp->Lock();

    return 1;
  }

procedures:
  // --------------------------------------------------------------------------------------
  // The entry point.
  // --------------------------------------------------------------------------------------
  Main()
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);
    
    m_tmAutoFadeOut = Clamp(m_tmAutoFadeOut, -1.0F, 3600.0F);
    
    if (m_fnmPicture != CTString(""))
    {
      try {
        m_moTextureHolder.mo_toTexture.SetData_t(m_fnmPicture);
      } catch (char *strError) {
        WarningMessage(strError);
      }
    }
    
    wait()
    {
      on (EBegin): 
      {
        resume;
      }

      on (EStart eStart): 
      {
        m_tmFadeOutStart = 1e6; // Reset fade out time.
        
        if (m_fnmPicture == "") { 
          CPrintF("%s : Texture path is empty!\n", m_strName);
          resume;
        }
        
        CWorldSettingsController *pwsc = GetWSC(this);

        if (pwsc != NULL)
        {
          m_tmFadeInStart = _pTimer->CurrentTick();
          EHudPicDisplay etfx;
          etfx.bStart = TRUE;
          etfx.penSender = this;
          pwsc->SendEvent(etfx);

          if (m_tmAutoFadeOut > 0.0F) {
            call WaitAndFadeOut();
          }
        }

        resume;
      }

      on (EStop eStop): 
      {
        call ApplyFadeOut();
        resume;
      }

      on (EReturn): 
      {
        resume;
      }
    }

    autowait(0.05f);

    return;
  }

  // --------------------------------------------------------------------------------------
  // Processing wait before fadeout.
  // --------------------------------------------------------------------------------------
  WaitAndFadeOut(EVoid)
  {
    autowait( m_tmAutoFadeOut);
    jump ApplyFadeOut();
  }

  // --------------------------------------------------------------------------------------
  // Applying fadeout.
  // --------------------------------------------------------------------------------------
  ApplyFadeOut(EVoid)
  {
    m_tmFadeOutStart = _pTimer->CurrentTick();
    CWorldSettingsController *pwsc = GetWSC(this);

    if (pwsc != NULL)
    {
      autowait(m_tmFadeOutLen);
      CWorldSettingsController *pwsc = GetWSC(this);
      ETextFX etfx;
      etfx.bStart=FALSE;
      etfx.penSender=this;
      pwsc->SendEvent(etfx);
    }

    return EReturn();
  }
};

