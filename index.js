/**
 * BoxJoints Plugin
 * Generates G-code for box joint operations
 */

export async function onLoad(ctx) {
  ctx.log('BoxJoints plugin loaded');

  // Register the BoxJoints tool in the Tools menu
  ctx.registerToolMenu('Box Joints', async () => {
    ctx.log('Box Joints tool clicked');

    // Get app settings to determine units
    const appSettings = ctx.getAppSettings();
    const unitsPreference = appSettings.unitsPreference || 'metric';
    const isImperial = unitsPreference === 'imperial';

    // Unit labels
    const distanceUnit = isImperial ? 'in' : 'mm';
    const feedRateUnit = isImperial ? 'in/min' : 'mm/min';

    // Get saved settings
    const savedSettings = ctx.getSettings()?.boxjoints || {};

    // Conversion factor
    const MM_TO_INCH = 0.0393701;
    const convertToDisplay = (value) => isImperial ? parseFloat((value * MM_TO_INCH).toFixed(4)) : value;

    const settings = {
      boardThickness: convertToDisplay(savedSettings.boardThickness ?? 19),
      boardWidth: convertToDisplay(savedSettings.boardWidth ?? 100),
      fingerCount: savedSettings.fingerCount ?? 4,
      bitDiameter: convertToDisplay(savedSettings.bitDiameter ?? 6.35),
      fitTolerance: convertToDisplay(savedSettings.fitTolerance ?? 0.1),
      pieceType: savedSettings.pieceType ?? 'A',
      orientation: savedSettings.orientation ?? 'X',
      depthPerPass: convertToDisplay(savedSettings.depthPerPass ?? 3),
      feedRate: convertToDisplay(savedSettings.feedRate ?? 1000),
      spindleRpm: savedSettings.spindleRpm ?? 18000,
      spindleDelay: savedSettings.spindleDelay ?? 3,
      mistM7: savedSettings.mistM7 ?? false,
      floodM8: savedSettings.floodM8 ?? false
    };

    ctx.showDialog(
      'Box Joints',
      /* html */ `
      <style>
        .boxjoints-layout {
          display: flex;
          flex-direction: column;
          max-width: 800px;
          width: 100%;
        }
        .form-column {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .plugin-dialog-footer {
          grid-column: 1 / -1;
          padding: 16px 20px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface);
        }
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-cards-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 12px;
          row-gap: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .form-card {
          background: var(--color-surface-muted);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-medium);
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
          min-width: 0;
        }

        .form-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
          text-align: center;
        }

        .calculated-info {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-small);
          padding: 12px;
          margin-top: 16px;
          font-size: 0.85rem;
        }

        .calculated-info-title {
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 8px;
        }

        .calculated-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          color: var(--color-text-secondary);
        }

        .calculated-label {
          font-weight: 500;
        }

        .calculated-value {
          font-weight: 600;
          color: var(--color-accent);
        }

        .validation-tooltip {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #dc3545;
          color: white;
          padding: 8px 12px;
          border-radius: var(--radius-small);
          font-size: 0.8rem;
          margin-top: 4px;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          display: none;
        }

        .validation-tooltip::before {
          content: '';
          position: absolute;
          top: -4px;
          left: 20px;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 4px solid #dc3545;
        }

        .form-group {
          position: relative;
        }

        .form-group.has-error .validation-tooltip {
          display: block;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-row.single {
          grid-template-columns: 1fr;
        }
        .form-row.coolant-row {
          grid-template-columns: 1fr;
          display: flex;
          align-items: center;
          gap: 0;
          justify-content: space-between;
        }
        .coolant-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text-primary);
          flex-shrink: 0;
        }
        .coolant-controls {
          flex: 1;
          display: flex;
          gap: 24px;
          justify-content: flex-end;
        }
        .coolant-control {
          flex: 1;
          display: flex;
          justify-content: flex-end;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        label {
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 4px;
          color: var(--color-text-primary);
          text-align: center;
        }
        input[type="number"] {
          padding: 8px;
          text-align: center;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-small);
          font-size: 0.9rem;
          background: var(--color-surface);
          color: var(--color-text-primary);
        }
        input[type="number"]:focus {
          outline: none;
          border-color: var(--color-accent);
        }
        input[type="number"].input-error {
          border-color: #dc3545;
        }
        select {
          padding: 8px;
          text-align: center;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-small);
          font-size: 0.9rem;
          background: var(--color-surface);
          color: var(--color-text-primary);
          cursor: pointer;
        }
        select:focus {
          outline: none;
          border-color: var(--color-accent);
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-surface-muted);
          border: 1px solid var(--color-border);
          transition: 0.3s;
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: var(--color-text-primary);
          transition: 0.3s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-color: var(--color-accent);
          border-color: var(--color-accent);
        }
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
          background-color: white;
        }
        .button-group {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: var(--radius-small);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn:hover {
          opacity: 0.9;
        }
        .btn-secondary {
          background: var(--color-surface-muted);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
        }
        .btn-primary {
          background: var(--color-accent);
          color: white;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .form-cards-container {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="boxjoints-layout">
        <div class="form-column">
          <form id="boxjointsForm" novalidate>
            <div class="form-cards-container">
              <!-- Left Column -->
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div class="form-card">
                  <div class="form-card-title">Dimensions</div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="boardThickness">Board Thickness (${distanceUnit})</label>
                      <input type="number" id="boardThickness" step="0.1" value="${settings.boardThickness}" required>
                      <div class="validation-tooltip" id="boardThickness-error"></div>
                    </div>
                    <div class="form-group">
                      <label for="boardWidth">Board Width (${distanceUnit})</label>
                      <input type="number" id="boardWidth" step="0.1" value="${settings.boardWidth}" required>
                      <div class="validation-tooltip" id="boardWidth-error"></div>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="fingerCount">Finger Count</label>
                      <input type="number" id="fingerCount" step="1" min="2" max="20" value="${settings.fingerCount}" required>
                      <div class="validation-tooltip" id="fingerCount-error"></div>
                    </div>
                    <div class="form-group">
                      <label for="fitTolerance">Fit Tolerance (${distanceUnit})</label>
                      <input type="number" id="fitTolerance" step="0.01" value="${settings.fitTolerance}" required>
                      <div class="validation-tooltip" id="fitTolerance-error"></div>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="pieceType">Piece Type</label>
                      <select id="pieceType">
                        <option value="A" ${settings.pieceType === 'A' ? 'selected' : ''}>A (pins)</option>
                        <option value="B" ${settings.pieceType === 'B' ? 'selected' : ''}>B (tails)</option>
                        <option value="Both" ${settings.pieceType === 'Both' ? 'selected' : ''}>Both (pins & tails)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="orientation">Orientation</label>
                      <select id="orientation">
                        <option value="X" ${settings.orientation === 'X' ? 'selected' : ''}>X (horizontal)</option>
                        <option value="Y" ${settings.orientation === 'Y' ? 'selected' : ''}>Y (vertical)</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-row single">
                    <div class="form-group">
                      <label for="depthPerPass">Depth Per Pass (${distanceUnit})</label>
                      <input type="number" id="depthPerPass" step="0.1" value="${settings.depthPerPass}" required>
                      <div class="validation-tooltip" id="depthPerPass-error"></div>
                    </div>
                  </div>
                </div>

                <div class="form-card">
                  <div class="form-card-title">Machine Settings</div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="bitDiameter">Bit Diameter (${distanceUnit})</label>
                      <input type="number" id="bitDiameter" step="0.01" value="${settings.bitDiameter}" required>
                      <div class="validation-tooltip" id="bitDiameter-error"></div>
                    </div>
                    <div class="form-group">
                      <label for="feedRate">Feed Rate (${feedRateUnit})</label>
                      <input type="number" id="feedRate" step="1" value="${settings.feedRate}" required>
                      <div class="validation-tooltip" id="feedRate-error"></div>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="spindleRpm">Spindle RPM</label>
                      <input type="number" id="spindleRpm" step="1" value="${settings.spindleRpm}" required>
                      <div class="validation-tooltip" id="spindleRpm-error"></div>
                    </div>
                    <div class="form-group">
                      <label for="spindleDelay">Spindle Delay (s)</label>
                      <input type="number" id="spindleDelay" min="0" max="30" step="1" value="${settings.spindleDelay}">
                    </div>
                  </div>
                  <div class="form-row coolant-row">
                    <div class="coolant-label">Mist Coolant</div>
                    <div class="coolant-control">
                      <label class="toggle-switch">
                        <input type="checkbox" id="mistM7" ${settings.mistM7 ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                  <div class="form-row coolant-row">
                    <div class="coolant-label">Flood Coolant</div>
                    <div class="coolant-control">
                      <label class="toggle-switch">
                        <input type="checkbox" id="floodM8" ${settings.floodM8 ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column -->
              <div class="form-card">
                <div class="form-card-title">Calculated Dimensions</div>
                <div id="legend-container" style="margin-bottom: 16px;"></div>
                <div id="preview-container"></div>
                <div id="instruction-container"></div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div class="plugin-dialog-footer">
        <div class="button-group">
          <button type="button" class="btn btn-secondary" onclick="window.postMessage({type: 'close-plugin-dialog'}, '*')">Close</button>
          <button type="button" class="btn btn-primary" onclick="document.getElementById('boxjointsForm').requestSubmit()">Generate</button>
        </div>
      </div>

      <script>
        (function() {
          const isImperial = ${isImperial};
          const INCH_TO_MM = 25.4;

          // Validation rules (metric)
          const validationRules = isImperial ? {
            boardThickness: { min: 0.1, max: 4, label: 'Board Thickness' },
            boardWidth: { min: 1, max: 48, label: 'Board Width' },
            fingerCount: { min: 2, max: 20, label: 'Finger Count', integer: true },
            bitDiameter: { min: 0.1, max: 1, label: 'Bit Diameter' },
            fitTolerance: { min: 0, max: 0.1, label: 'Fit Tolerance' },
            depthPerPass: { min: 0.01, max: 4, label: 'Depth Per Pass' },
            feedRate: { min: 10, max: 500, label: 'Feed Rate' },
            spindleRpm: { min: 1000, max: 30000, label: 'Spindle RPM' }
          } : {
            boardThickness: { min: 3, max: 100, label: 'Board Thickness' },
            boardWidth: { min: 25, max: 1200, label: 'Board Width' },
            fingerCount: { min: 2, max: 20, label: 'Finger Count', integer: true },
            bitDiameter: { min: 3, max: 25, label: 'Bit Diameter' },
            fitTolerance: { min: 0, max: 2, label: 'Fit Tolerance' },
            depthPerPass: { min: 0.5, max: 100, label: 'Depth Per Pass' },
            feedRate: { min: 100, max: 10000, label: 'Feed Rate' },
            spindleRpm: { min: 1000, max: 30000, label: 'Spindle RPM' }
          };

          function validateInput(fieldId) {
            const input = document.getElementById(fieldId);
            const errorDiv = document.getElementById(fieldId + '-error');
            const formGroup = input?.closest('.form-group');
            const value = parseFloat(input.value);
            const rules = validationRules[fieldId];

            if (!rules || !input) return true;

            if (isNaN(value)) {
              input.classList.add('input-error');
              if (formGroup) formGroup.classList.add('has-error');
              if (errorDiv) errorDiv.textContent = \`\${rules.label} is required\`;
              return false;
            }

            if (rules.integer && !Number.isInteger(value)) {
              input.classList.add('input-error');
              if (formGroup) formGroup.classList.add('has-error');
              if (errorDiv) errorDiv.textContent = \`\${rules.label} must be a whole number\`;
              return false;
            }

            if (value < rules.min || value > rules.max) {
              input.classList.add('input-error');
              if (formGroup) formGroup.classList.add('has-error');
              if (errorDiv) errorDiv.textContent = \`Must be between \${rules.min} and \${rules.max}\`;
              return false;
            }

            input.classList.remove('input-error');
            if (formGroup) formGroup.classList.remove('has-error');
            if (errorDiv) errorDiv.textContent = '';
            return true;
          }

          function validateAllInputs() {
            const fields = Object.keys(validationRules);
            let isValid = true;
            fields.forEach(field => {
              if (!validateInput(field)) {
                isValid = false;
              }
            });
            return isValid;
          }

          // Validate slot width vs bit diameter
          function validateSlotVsBit() {
            const boardWidth = parseFloat(document.getElementById('boardWidth').value);
            const fingerCount = parseInt(document.getElementById('fingerCount').value);
            const fitTolerance = parseFloat(document.getElementById('fitTolerance').value);
            const bitDiameter = parseFloat(document.getElementById('bitDiameter').value);
            const pieceType = document.getElementById('pieceType').value;

            const fingerCountInput = document.getElementById('fingerCount');
            const fingerCountErrorDiv = document.getElementById('fingerCount-error');
            const fingerCountFormGroup = fingerCountInput?.closest('.form-group');

            // Only validate if all values are present
            if (isNaN(boardWidth) || isNaN(fingerCount) || isNaN(bitDiameter) || fingerCount <= 0) {
              // Clear any existing error
              fingerCountInput.classList.remove('input-error');
              if (fingerCountFormGroup) fingerCountFormGroup.classList.remove('has-error');
              if (fingerCountErrorDiv) fingerCountErrorDiv.textContent = '';
              return true;
            }

            const convertToMetric = (value) => isImperial ? value * INCH_TO_MM : value;
            const boardWidthMetric = convertToMetric(boardWidth);
            const bitDiameterMetric = convertToMetric(bitDiameter);
            const fitToleranceMetric = convertToMetric(fitTolerance || 0);
            const numSlots = pieceType === 'A' ? fingerCount - 1 : fingerCount;
            const calculatedFingerWidth = (boardWidthMetric - (numSlots * fitToleranceMetric)) / ((fingerCount * 2) - 1);
            const calculatedSlotWidth = calculatedFingerWidth + fitToleranceMetric;

            if (calculatedSlotWidth < bitDiameterMetric) {
              fingerCountInput.classList.add('input-error');
              if (fingerCountFormGroup) fingerCountFormGroup.classList.add('has-error');
              if (fingerCountErrorDiv) {
                fingerCountErrorDiv.textContent = \`Slot width (\${calculatedSlotWidth.toFixed(2)}mm) is smaller than bit diameter (\${bitDiameterMetric.toFixed(2)}mm). Use fewer fingers or smaller bit.\`;
              }
              return false;
            } else {
              fingerCountInput.classList.remove('input-error');
              if (fingerCountFormGroup) fingerCountFormGroup.classList.remove('has-error');
              if (fingerCountErrorDiv) fingerCountErrorDiv.textContent = '';
              return true;
            }
          }

          // Update calculated dimensions
          function updateCalculatedDimensions() {
            const boardWidth = parseFloat(document.getElementById('boardWidth').value);
            const fingerCount = parseInt(document.getElementById('fingerCount').value);
            const fitTolerance = parseFloat(document.getElementById('fitTolerance').value);
            const pieceType = document.getElementById('pieceType').value;
            const orientation = document.getElementById('orientation').value;

            if (!isNaN(boardWidth) && !isNaN(fingerCount) && fingerCount > 0) {
              const convertToMetric = (value) => isImperial ? value * INCH_TO_MM : value;
              const boardWidthMetric = convertToMetric(boardWidth);
              const fitToleranceMetric = convertToMetric(fitTolerance || 0);

              // Both pieces have the same dimensions, just different patterns:
              // Piece A: fingerCount fingers + (fingerCount-1) slots
              // Piece B: (fingerCount-1) fingers + fingerCount slots
              // Both have same total: (2*fingerCount - 1) elements
              // Total width: fingerCount*fw + (fingerCount-1)*(fw+ft) = bw
              // Simplify: fingerCount*fw + (fingerCount-1)*fw + (fingerCount-1)*ft = bw
              // = (2*fingerCount - 1)*fw + (fingerCount-1)*ft = bw
              const fingerWidth = (boardWidthMetric - ((fingerCount - 1) * fitToleranceMetric)) / ((fingerCount * 2) - 1);
              const slotWidth = fingerWidth + fitToleranceMetric;

              // Update preview
              updatePreview(fingerWidth, slotWidth, fingerCount, pieceType, orientation);
            } else {
              document.getElementById('preview-container').innerHTML = '';
              document.getElementById('legend-container').innerHTML = '';
            }

            // Validate slot vs bit
            validateSlotVsBit();
          }

          // Generate SVG preview of box joints
          function updatePreview(fingerWidth, slotWidth, fingerCount, pieceType, orientation) {
            const previewContainer = document.getElementById('preview-container');
            const legendContainer = document.getElementById('legend-container');
            const instructionContainer = document.getElementById('instruction-container');
            if (!previewContainer || !legendContainer) return;

            // Get board thickness and width from form
            const boardThickness = parseFloat(document.getElementById('boardThickness').value) || 0;
            const boardWidthInput = parseFloat(document.getElementById('boardWidth').value) || 0;

            const padding = 0;
            const availableWidth = previewContainer.offsetWidth - (padding * 2);

            // Calculate total width for scaling (use Piece A dimensions)
            const numFingersA = fingerCount;
            const numSlotsA = fingerCount - 1;
            const totalWidth = (fingerWidth * numFingersA) + (slotWidth * numSlotsA);
            const scale = availableWidth / totalWidth;
            const svgWidth = availableWidth + (padding * 2);

            // Wood colors
            const woodColorA = '#E8C9A0';
            const woodColorB = '#E8C9A0';
            const textColor = '#6B5538';

            // Dimension colors
            const stockWidthColor = '#E74C3C';
            const slotWidthColor = '#3498DB';
            const fingerWidthColor = '#2ECC71';
            const boardThicknessColor = '#9B59B6';

            // Wood grain pattern definitions
            const woodGrainDefs = \`
              <defs>
                <pattern id="woodGrainA" patternUnits="userSpaceOnUse" width="200" height="12">
                  <rect width="200" height="12" fill="\${woodColorA}"/>
                  <path d="M0,2 Q50,0 100,3 T200,2" stroke="#D4B896" stroke-width="0.5" fill="none" opacity="0.6"/>
                  <path d="M0,6 Q40,4 80,7 T160,5 T200,6" stroke="#C9A882" stroke-width="0.8" fill="none" opacity="0.5"/>
                  <path d="M0,10 Q60,8 120,11 T200,9" stroke="#D4B896" stroke-width="0.5" fill="none" opacity="0.4"/>
                </pattern>
                <pattern id="woodGrainB" patternUnits="userSpaceOnUse" width="200" height="12">
                  <rect width="200" height="12" fill="\${woodColorB}"/>
                  <path d="M0,2 Q50,0 100,3 T200,2" stroke="#D4B896" stroke-width="0.5" fill="none" opacity="0.6"/>
                  <path d="M0,6 Q40,4 80,7 T160,5 T200,6" stroke="#C9A882" stroke-width="0.8" fill="none" opacity="0.5"/>
                  <path d="M0,10 Q60,8 120,11 T200,9" stroke="#D4B896" stroke-width="0.5" fill="none" opacity="0.4"/>
                </pattern>
              </defs>
            \`;

            // Handle "Both" mode - draw two pieces stacked
            if (pieceType === 'Both') {
              const boardHeight = 120;
              const fingerHeight = 16;
              const gapBetweenPieces = 20;
              const svgHeight = (boardHeight + fingerHeight) * 2 + gapBetweenPieces + 20;

              let svg = \`<svg width="\${svgWidth}" height="\${svgHeight}" style="display: block; margin: 0 auto;">\`;
              svg += woodGrainDefs;

              // Draw Piece A (top)
              const pieceATopY = 10;
              const pieceABoardY = pieceATopY + fingerHeight;
              svg += \`<rect x="\${padding}" y="\${pieceABoardY}" width="\${totalWidth * scale}" height="\${boardHeight}" fill="url(#woodGrainA)"/>\`;

              let x = padding;
              const totalElements = (2 * fingerCount) - 1;
              for (let i = 0; i < totalElements; i++) {
                const isFinger = (i % 2 === 0); // Piece A starts with finger
                const width = (isFinger ? fingerWidth : slotWidth) * scale;
                if (isFinger) {
                  svg += \`<rect x="\${x}" y="\${pieceATopY}" width="\${width}" height="\${fingerHeight}" fill="url(#woodGrainA)"/>\`;
                }
                x += width;
              }
              const pieceALabelY = pieceABoardY + (boardHeight / 2) + 5;
              svg += \`<text x="\${svgWidth / 2}" y="\${pieceALabelY}" text-anchor="middle" fill="\${textColor}" font-size="14" font-weight="600" font-family="system-ui">Piece A (pins)</text>\`;

              // Draw Piece B (bottom)
              const pieceBTopY = pieceABoardY + boardHeight + gapBetweenPieces;
              const pieceBBoardY = pieceBTopY + fingerHeight;
              svg += \`<rect x="\${padding}" y="\${pieceBBoardY}" width="\${totalWidth * scale}" height="\${boardHeight}" fill="url(#woodGrainB)"/>\`;

              x = padding;
              for (let i = 0; i < totalElements; i++) {
                const isFinger = (i % 2 === 1); // Piece B starts with slot
                const width = (isFinger ? fingerWidth : slotWidth) * scale;
                if (isFinger) {
                  svg += \`<rect x="\${x}" y="\${pieceBTopY}" width="\${width}" height="\${fingerHeight}" fill="url(#woodGrainB)"/>\`;
                }
                x += width;
              }
              const pieceBLabelY = pieceBBoardY + (boardHeight / 2) + 5;
              svg += \`<text x="\${svgWidth / 2}" y="\${pieceBLabelY}" text-anchor="middle" fill="\${textColor}" font-size="14" font-weight="600" font-family="system-ui">Piece B (tails)</text>\`;

              // Board width indicator on Piece A bottom
              const pieceABottomY = pieceABoardY + boardHeight;
              svg += \`<line x1="\${padding}" y1="\${pieceABottomY}" x2="\${padding + totalWidth * scale}" y2="\${pieceABottomY}" stroke="\${stockWidthColor}" stroke-width="4"/>\`;

              // Board width indicator on Piece B bottom
              const pieceBBottomY = pieceBBoardY + boardHeight;
              svg += \`<line x1="\${padding}" y1="\${pieceBBottomY}" x2="\${padding + totalWidth * scale}" y2="\${pieceBBottomY}" stroke="\${stockWidthColor}" stroke-width="4"/>\`;

              // Slot width indicator on Piece A (first slot)
              const firstSlotStartA = padding + fingerWidth * scale;
              const firstSlotEndA = firstSlotStartA + (slotWidth * scale);
              svg += \`<line x1="\${firstSlotStartA}" y1="\${pieceABoardY}" x2="\${firstSlotEndA}" y2="\${pieceABoardY}" stroke="\${slotWidthColor}" stroke-width="3"/>\`;

              // Board thickness indicator (vertical line on Piece A)
              svg += \`<line x1="\${firstSlotEndA}" y1="\${pieceATopY}" x2="\${firstSlotEndA}" y2="\${pieceABoardY}" stroke="\${boardThicknessColor}" stroke-width="3"/>\`;

              // Finger width indicator on Piece A (first finger)
              const firstFingerEndA = padding + (fingerWidth * scale);
              svg += \`<line x1="\${padding}" y1="\${pieceATopY}" x2="\${firstFingerEndA}" y2="\${pieceATopY}" stroke="\${fingerWidthColor}" stroke-width="3"/>\`;

              svg += '</svg>';
              previewContainer.innerHTML = svg;
            } else {
              // Single piece mode (A or B)
              const svgHeight = 300;
              const boardHeight = 260;
              const fingerHeight = 20;
              const boardTopY = 10;

              let svg = \`<svg width="\${svgWidth}" height="\${svgHeight}" style="display: block; margin: 0 auto;">\`;
              svg += woodGrainDefs;

              const woodPattern = pieceType === 'A' ? 'url(#woodGrainA)' : 'url(#woodGrainB)';
              const boardY = boardTopY + fingerHeight;
              const numFingers = pieceType === 'A' ? fingerCount : (fingerCount - 1);
              const numSlots = pieceType === 'A' ? (fingerCount - 1) : fingerCount;
              const singleTotalWidth = (fingerWidth * numFingers) + (slotWidth * numSlots);
              const singleScale = availableWidth / singleTotalWidth;

              svg += \`<rect x="\${padding}" y="\${boardY}" width="\${singleTotalWidth * singleScale}" height="\${boardHeight}" fill="\${woodPattern}"/>\`;

              let x = padding;
              const totalElements = (2 * fingerCount) - 1;
              for (let i = 0; i < totalElements; i++) {
                const isFinger = pieceType === 'A' ? (i % 2 === 0) : (i % 2 === 1);
                const width = (isFinger ? fingerWidth : slotWidth) * singleScale;
                if (isFinger) {
                  svg += \`<rect x="\${x}" y="\${boardTopY}" width="\${width}" height="\${fingerHeight}" fill="\${woodPattern}"/>\`;
                }
                x += width;
              }

              const labelY = boardY + (boardHeight / 2) + 5;
              const pieceLabel = pieceType === 'A' ? 'Piece A (pins)' : 'Piece B (tails)';
              svg += \`<text x="\${svgWidth / 2}" y="\${labelY}" text-anchor="middle" fill="\${textColor}" font-size="16" font-weight="600" font-family="system-ui">\${pieceLabel}</text>\`;

              const boardBottomY = boardY + boardHeight;
              svg += \`<line x1="\${padding}" y1="\${boardBottomY}" x2="\${padding + singleTotalWidth * singleScale}" y2="\${boardBottomY}" stroke="\${stockWidthColor}" stroke-width="5"/>\`;

              const firstSlotStart = pieceType === 'A' ? (padding + fingerWidth * singleScale) : padding;
              const firstSlotEnd = firstSlotStart + (slotWidth * singleScale);
              const slotTopY = boardY;
              svg += \`<line x1="\${firstSlotStart}" y1="\${slotTopY}" x2="\${firstSlotEnd}" y2="\${slotTopY}" stroke="\${slotWidthColor}" stroke-width="3"/>\`;

              const fingerTopY = boardTopY;
              svg += \`<line x1="\${firstSlotEnd}" y1="\${fingerTopY}" x2="\${firstSlotEnd}" y2="\${slotTopY}" stroke="\${boardThicknessColor}" stroke-width="3"/>\`;

              const firstFingerStart = pieceType === 'A' ? padding : (padding + slotWidth * singleScale);
              const firstFingerEnd = firstFingerStart + (fingerWidth * singleScale);
              svg += \`<line x1="\${firstFingerStart}" y1="\${fingerTopY}" x2="\${firstFingerEnd}" y2="\${fingerTopY}" stroke="\${fingerWidthColor}" stroke-width="3"/>\`;

              svg += '</svg>';
              previewContainer.innerHTML = svg;
            }

            // Add legend at the top
            const unit = 'mm';
            const legendHTML = \`
              <div style="font-size: 13px; font-family: system-ui; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: \${stockWidthColor}15; border: 1px solid \${stockWidthColor}40; border-radius: 8px;">
                  <div style="width: 16px; height: 16px; background: \${stockWidthColor}; border-radius: 4px; flex-shrink: 0;"></div>
                  <div style="display: flex; flex-direction: column; line-height: 1.2;">
                    <span style="color: var(--color-text-secondary); font-size: 11px;">Board Width</span>
                    <span style="color: \${stockWidthColor}; font-weight: 600;">\${boardWidthInput.toFixed(1)} \${unit}</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: \${boardThicknessColor}15; border: 1px solid \${boardThicknessColor}40; border-radius: 8px;">
                  <div style="width: 16px; height: 16px; background: \${boardThicknessColor}; border-radius: 4px; flex-shrink: 0;"></div>
                  <div style="display: flex; flex-direction: column; line-height: 1.2;">
                    <span style="color: var(--color-text-secondary); font-size: 11px;">Board Thickness</span>
                    <span style="color: \${boardThicknessColor}; font-weight: 600;">\${boardThickness.toFixed(1)} \${unit}</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: \${fingerWidthColor}15; border: 1px solid \${fingerWidthColor}40; border-radius: 8px;">
                  <div style="width: 16px; height: 16px; background: \${fingerWidthColor}; border-radius: 4px; flex-shrink: 0;"></div>
                  <div style="display: flex; flex-direction: column; line-height: 1.2;">
                    <span style="color: var(--color-text-secondary); font-size: 11px;">Finger Width</span>
                    <span style="color: \${fingerWidthColor}; font-weight: 600;">\${fingerWidth.toFixed(1)} \${unit}</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: \${slotWidthColor}15; border: 1px solid \${slotWidthColor}40; border-radius: 8px;">
                  <div style="width: 16px; height: 16px; background: \${slotWidthColor}; border-radius: 4px; flex-shrink: 0;"></div>
                  <div style="display: flex; flex-direction: column; line-height: 1.2;">
                    <span style="color: var(--color-text-secondary); font-size: 11px;">Slot Width</span>
                    <span style="color: \${slotWidthColor}; font-weight: 600;">\${slotWidth.toFixed(1)} \${unit}</span>
                  </div>
                </div>
              </div>
            \`;

            legendContainer.innerHTML = legendHTML;

            // Show instruction based on piece type and orientation
            if (instructionContainer) {
              let instructionText = '';
              const orientationDesc = orientation === 'X' ? 'horizontal (along X-axis)' : 'vertical (along Y-axis)';
              if (pieceType === 'Both') {
                if (orientation === 'X') {
                  instructionText = 'Place both boards side by side with Piece A on the left and Piece B on the right. Fingers are oriented ' + orientationDesc + '. Set X0 Y0 at the front-left corner of Piece A.';
                } else {
                  instructionText = 'Place both boards one above the other with Piece A at the front and Piece B behind it. Fingers are oriented ' + orientationDesc + '. Set X0 Y0 at the front-left corner of Piece A.';
                }
              } else if (pieceType === 'A') {
                instructionText = 'Place the board for Piece A (pins). Fingers are oriented ' + orientationDesc + '. Set X0 Y0 at the front-left corner of the board.';
              } else if (pieceType === 'B') {
                instructionText = 'Place the board for Piece B (tails). Fingers are oriented ' + orientationDesc + '. Set X0 Y0 at the front-left corner of the board.';
              }

              if (instructionText) {
                instructionContainer.innerHTML = \`
                  <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; font-size: 13px; color: #856404;">
                    <strong>Setup:</strong> \${instructionText}
                  </div>
                \`;
              } else {
                instructionContainer.innerHTML = '';
              }
            }
          }

          // Add validation on blur for each input
          Object.keys(validationRules).forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
              input.addEventListener('blur', () => validateInput(fieldId));
              input.addEventListener('input', () => {
                if (input.classList.contains('input-error')) {
                  validateInput(fieldId);
                }
                // Update calculated dimensions when relevant fields change
                if (['boardWidth', 'fingerCount', 'fitTolerance'].includes(fieldId)) {
                  updateCalculatedDimensions();
                }
              });

              // Block decimal point for integer fields
              if (validationRules[fieldId].integer) {
                input.addEventListener('keydown', (e) => {
                  if (e.key === '.' || e.key === ',') {
                    e.preventDefault();
                  }
                });
              }
            }
          });

          // Add listeners for real-time calculation updates
          ['boardWidth', 'boardThickness', 'fingerCount', 'fitTolerance', 'bitDiameter', 'pieceType', 'orientation'].forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
              input.addEventListener(['pieceType', 'orientation'].includes(fieldId) ? 'change' : 'input', updateCalculatedDimensions);
            }
          });

          // Initial calculation
          updateCalculatedDimensions();

          function generateBoxJointsGCode(params) {
            const {
              boardThickness,
              boardWidth,
              fingerCount,
              bitDiameter,
              fitTolerance,
              pieceType,
              orientation,
              depthPerPass,
              feedRate,
              spindleRpm,
              spindleDelay,
              mistM7,
              floodM8
            } = params;

            // Convert to metric if needed
            const convertToMetric = (value) => isImperial ? value * INCH_TO_MM : value;
            const bt = convertToMetric(boardThickness);
            const bw = convertToMetric(boardWidth);
            const bd = convertToMetric(bitDiameter);
            const ft = convertToMetric(fitTolerance);
            const dpp = convertToMetric(depthPerPass);
            const fr = convertToMetric(feedRate);

            // Calculate finger width (same for both pieces)
            // Using Piece A formula: (fingerCount - 1) slots
            const fw = (bw - ((fingerCount - 1) * ft)) / ((fingerCount * 2) - 1);

            const gcode = [];

            // Header
            const pieceLabel = pieceType === 'Both' ? 'Both (A & B)' : pieceType;
            gcode.push('(Box Joints - Piece ' + pieceLabel + ')');
            gcode.push(\`(Orientation: \${orientation}-axis)\`);
            gcode.push(\`(Board Thickness: \${boardThickness}\${isImperial ? 'in' : 'mm'})\`);
            gcode.push(\`(Board Width: \${boardWidth}\${isImperial ? 'in' : 'mm'})\`);
            gcode.push(\`(Finger Count: \${fingerCount})\`);
            gcode.push(\`(Calculated Finger Width: \${fw.toFixed(3)}mm)\`);
            gcode.push(\`(Bit Diameter: \${bitDiameter}\${isImperial ? 'in' : 'mm'})\`);
            gcode.push('');

            // Setup
            gcode.push('G21 ; Metric units');
            gcode.push('G90 ; Absolute positioning');
            gcode.push('G94 ; Feed per minute');

            // Coolant
            if (mistM7) gcode.push('M7 ; Mist coolant on');
            if (floodM8) gcode.push('M8 ; Flood coolant on');

            // Spindle
            if (spindleRpm > 0) {
              gcode.push(\`M3 S\${spindleRpm} ; Start spindle\`);
              gcode.push(\`G4 P\${spindleDelay} ; Spindle delay\`);
            }
            gcode.push('');

            // Slot width should equal finger width + tolerance
            const slotWidth = fw + ft;

            // Calculate number of passes needed
            const numPasses = Math.ceil(bt / dpp);

            gcode.push('G53 G0 Z0 ; Move to machine Z0 (safe height)');
            gcode.push('');

            // Calculate bit and stepover parameters
            const bitRadius = bd / 2;
            const stepOver = bd * 0.4; // 40% stepover for better coverage
            const extraTravelY = 5 + bitRadius; // Extra travel beyond material face on Y axis

            // Helper function to generate slots for a piece
            // For X orientation: slots positioned along X, tool moves along Y
            // For Y orientation: slots positioned along Y, tool moves along X
            function generateSlotsForPiece(pieceName, primaryOffset, numSlots, startOffset) {
              gcode.push(\`(========== \${pieceName} ==========)\`);
              gcode.push('');

              for (let i = 0; i < numSlots; i++) {
                const slotStart = primaryOffset + startOffset + (i * (fw + slotWidth));
                const slotEnd = slotStart + slotWidth;

                gcode.push(\`(=== \${pieceName} - Slot \${i + 1} ===)\`);
                gcode.push('');

                // Secondary axis travel (perpendicular to slot direction)
                const secondaryStart = -extraTravelY;
                const secondaryEnd = bt + extraTravelY;

                // Primary axis boundaries (along slot direction)
                const primaryMin = slotStart + bitRadius;
                const primaryMax = slotEnd - bitRadius;

                for (let pass = 0; pass < numPasses; pass++) {
                  const depth = -Math.min((pass + 1) * dpp, bt);

                  gcode.push(\`(Layer \${pass + 1} at depth \${depth.toFixed(3)}mm)\`);

                  const centerPrimary = (primaryMin + primaryMax) / 2;
                  const totalSpan = primaryMax - primaryMin;
                  const stepsToEdge = Math.ceil(totalSpan / (2 * stepOver));

                  let leftPrimary = centerPrimary;
                  let rightPrimary = centerPrimary;

                  // Position at center of slot, at the back/right edge
                  if (orientation === 'X') {
                    gcode.push(\`G0 X\${centerPrimary.toFixed(3)} Y\${secondaryEnd.toFixed(3)}\`);
                  } else {
                    gcode.push(\`G0 X\${secondaryEnd.toFixed(3)} Y\${centerPrimary.toFixed(3)}\`);
                  }
                  gcode.push(\`G0 Z\${depth.toFixed(3)}\`);

                  // Move to front/left edge
                  if (orientation === 'X') {
                    gcode.push(\`G1 Y\${secondaryStart.toFixed(3)} F\${fr.toFixed(1)}\`);
                  } else {
                    gcode.push(\`G1 X\${secondaryStart.toFixed(3)} F\${fr.toFixed(1)}\`);
                  }

                  for (let step = 0; step < stepsToEdge; step++) {
                    // Step to the right/positive on primary axis
                    rightPrimary += stepOver;
                    if (rightPrimary > primaryMax) rightPrimary = primaryMax;
                    if (orientation === 'X') {
                      gcode.push(\`G1 X\${rightPrimary.toFixed(3)}\`);
                    } else {
                      gcode.push(\`G1 Y\${rightPrimary.toFixed(3)}\`);
                    }

                    // Move to back/right edge on secondary axis
                    if (orientation === 'X') {
                      gcode.push(\`G1 Y\${secondaryEnd.toFixed(3)}\`);
                    } else {
                      gcode.push(\`G1 X\${secondaryEnd.toFixed(3)}\`);
                    }

                    // Step to the left/negative on primary axis
                    leftPrimary -= stepOver;
                    if (leftPrimary < primaryMin) leftPrimary = primaryMin;
                    if (orientation === 'X') {
                      gcode.push(\`G1 X\${leftPrimary.toFixed(3)}\`);
                    } else {
                      gcode.push(\`G1 Y\${leftPrimary.toFixed(3)}\`);
                    }

                    // Move to front/left edge on secondary axis
                    if (orientation === 'X') {
                      gcode.push(\`G1 Y\${secondaryStart.toFixed(3)}\`);
                    } else {
                      gcode.push(\`G1 X\${secondaryStart.toFixed(3)}\`);
                    }

                    if (leftPrimary <= primaryMin && rightPrimary >= primaryMax) break;
                  }

                  gcode.push('');
                }

                gcode.push('G0 Z5.0');
                gcode.push('');
              }
            }

            // Generate slots based on piece type
            if (pieceType === 'Both') {
              // Piece A: starts with finger, (fingerCount - 1) slots
              const numSlotsA = fingerCount - 1;
              const startOffsetA = fw; // First slot starts after first finger
              generateSlotsForPiece('Piece A', 0, numSlotsA, startOffsetA);

              // Piece B: starts with slot, fingerCount slots
              // Piece B is positioned after Piece A along the primary axis
              // (X=bw for X orientation, Y=bw for Y orientation)
              const numSlotsB = fingerCount;
              const startOffsetB = 0; // First slot starts at the edge
              generateSlotsForPiece('Piece B', bw, numSlotsB, startOffsetB);
            } else {
              // Single piece mode
              const numSlots = pieceType === 'A' ? fingerCount - 1 : fingerCount;
              const startOffset = pieceType === 'A' ? fw : 0;
              generateSlotsForPiece('Piece ' + pieceType, 0, numSlots, startOffset);
            }

            // Footer
            gcode.push('G53 G0 Z0 ; Retract to machine Z0');
            if (mistM7 || floodM8) gcode.push('M9 ; Coolant off');
            if (spindleRpm > 0) gcode.push('M5 ; Spindle off');
            gcode.push('M30 ; Program end');

            return gcode.join('\\n');
          }

          document.getElementById('boxjointsForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate all inputs
            if (!validateAllInputs()) {
              return;
            }

            // Get values from form
            const displayValues = {
              boardThickness: parseFloat(document.getElementById('boardThickness').value),
              boardWidth: parseFloat(document.getElementById('boardWidth').value),
              fingerCount: parseInt(document.getElementById('fingerCount').value),
              bitDiameter: parseFloat(document.getElementById('bitDiameter').value),
              fitTolerance: parseFloat(document.getElementById('fitTolerance').value),
              pieceType: document.getElementById('pieceType').value,
              orientation: document.getElementById('orientation').value,
              depthPerPass: parseFloat(document.getElementById('depthPerPass').value),
              feedRate: parseFloat(document.getElementById('feedRate').value),
              spindleRpm: parseFloat(document.getElementById('spindleRpm').value),
              spindleDelay: parseInt(document.getElementById('spindleDelay').value),
              mistM7: document.getElementById('mistM7').checked,
              floodM8: document.getElementById('floodM8').checked
            };

            // Validate slot width vs bit diameter
            if (!validateSlotVsBit()) {
              return;
            }

            // Convert to metric for storage
            const convertToMetric = (value) => isImperial ? value * INCH_TO_MM : value;
            const settingsToSave = {
              boxjoints: {
                boardThickness: convertToMetric(displayValues.boardThickness),
                boardWidth: convertToMetric(displayValues.boardWidth),
                fingerCount: displayValues.fingerCount,
                bitDiameter: convertToMetric(displayValues.bitDiameter),
                fitTolerance: convertToMetric(displayValues.fitTolerance),
                pieceType: displayValues.pieceType,
                orientation: displayValues.orientation,
                depthPerPass: convertToMetric(displayValues.depthPerPass),
                feedRate: convertToMetric(displayValues.feedRate),
                spindleRpm: displayValues.spindleRpm,
                spindleDelay: displayValues.spindleDelay,
                mistM7: displayValues.mistM7,
                floodM8: displayValues.floodM8
              }
            };

            // Save settings
            await fetch('/api/plugins/com.ncsender.boxjoints/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settingsToSave)
            });

            console.log('Box Joints settings saved:', settingsToSave);

            // Generate G-code
            const gcode = generateBoxJointsGCode(displayValues);

            // Create FormData and upload G-code as file
            const formData = new FormData();
            const blob = new Blob([gcode], { type: 'text/plain' });
            const pieceTypeLabel = displayValues.pieceType === 'Both' ? 'AB' : displayValues.pieceType;
            const filename = \`BoxJoint_\${pieceTypeLabel}_\${displayValues.orientation}_BT-\${displayValues.boardThickness}_BW-\${displayValues.boardWidth}_FC-\${displayValues.fingerCount}_DPP-\${displayValues.depthPerPass}.nc\`;
            formData.append('file', blob, filename);

            try {
              const response = await fetch('/api/gcode-files', {
                method: 'POST',
                body: formData
              });

              if (response.ok) {
                console.log('Box Joints G-code generated and loaded');
              } else {
                console.error('Failed to load G-code');
              }
            } catch (error) {
              console.error('Error uploading G-code:', error);
            }

            window.postMessage({type: 'close-plugin-dialog'}, '*');
          });
        })();
      </script>
      `,
      {
        closable: true,
        width: '800px'
      }
    );
  }, { icon: 'logo.png' });
}

export async function onUnload(ctx) {
  ctx.log('BoxJoints plugin unloaded');
}
