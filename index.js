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
                      </select>
                    </div>
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
              updatePreview(fingerWidth, slotWidth, fingerCount, pieceType);
            } else {
              document.getElementById('preview-container').innerHTML = '';
              document.getElementById('legend-container').innerHTML = '';
            }

            // Validate slot vs bit
            validateSlotVsBit();
          }

          // Generate SVG preview of box joints
          function updatePreview(fingerWidth, slotWidth, fingerCount, pieceType) {
            const previewContainer = document.getElementById('preview-container');
            const legendContainer = document.getElementById('legend-container');
            if (!previewContainer || !legendContainer) return;

            // Get board thickness and width from form
            const boardThickness = parseFloat(document.getElementById('boardThickness').value) || 0;
            const boardWidthInput = parseFloat(document.getElementById('boardWidth').value) || 0;

            const svgHeight = 380;
            const padding = 0;
            const availableWidth = previewContainer.offsetWidth - (padding * 2);

            // Calculate total width and scale
            // Piece A: fingerCount fingers, (fingerCount-1) slots
            // Piece B: (fingerCount-1) fingers, fingerCount slots
            const numFingers = pieceType === 'A' ? fingerCount : (fingerCount - 1);
            const numSlots = pieceType === 'A' ? (fingerCount - 1) : fingerCount;
            const totalWidth = (fingerWidth * numFingers) + (slotWidth * numSlots);
            const scale = availableWidth / totalWidth;
            const svgWidth = availableWidth + (padding * 2);

            const boardHeight = 340;
            const fingerHeight = 25;
            const boardTopY = 15;

            let svg = \`<svg width="\${svgWidth}" height="\${svgHeight}" style="display: block; margin: 0 auto;">\`;

            // Wood color
            const woodColor = '#D4A574';
            const textColor = '#6B5538';

            // Board base
            const boardY = boardTopY + fingerHeight;
            svg += \`<rect x="\${padding}" y="\${boardY}" width="\${totalWidth * scale}" height="\${boardHeight}" fill="\${woodColor}"/>\`;

            // Draw fingers and slots
            let x = padding;

            // Piece A: fingerCount fingers, (fingerCount-1) slots
            // Piece B: (fingerCount-1) fingers, fingerCount slots
            // Total elements = 2*fingerCount - 1
            const totalElements = (2 * fingerCount) - 1;

            for (let i = 0; i < totalElements; i++) {
              // Piece A: starts with finger (even indices are fingers)
              // Piece B: starts with slot (even indices are slots)
              const isFinger = pieceType === 'A' ? (i % 2 === 0) : (i % 2 === 1);
              const width = (isFinger ? fingerWidth : slotWidth) * scale;

              if (isFinger) {
                // Draw finger
                const fingerY = boardTopY;
                svg += \`<rect x="\${x}" y="\${fingerY}" width="\${width}" height="\${fingerHeight}" fill="\${woodColor}"/>\`;
              }
              // Slots are just gaps (transparent), no need to draw anything

              x += width;
            }

            // Label - centered on the wood board
            const labelY = boardY + (boardHeight / 2) + 5;
            svg += \`<text x="\${svgWidth / 2}" y="\${labelY}" text-anchor="middle" fill="\${textColor}" font-size="16" font-weight="600" font-family="system-ui">Piece \${pieceType}</text>\`;

            // Add colored border indicator for board width
            const boardBottomY = boardY + boardHeight;
            const stockWidthColor = '#E74C3C'; // Red color for board width
            svg += \`<line x1="\${padding}" y1="\${boardBottomY}" x2="\${padding + totalWidth * scale}" y2="\${boardBottomY}" stroke="\${stockWidthColor}" stroke-width="5"/>\`;

            // Add colored border indicator for slot width (on first slot from left, at the top)
            const slotWidthColor = '#3498DB'; // Blue color for slot width
            const firstSlotStart = pieceType === 'A' ? (padding + fingerWidth * scale) : padding;
            const firstSlotEnd = firstSlotStart + (slotWidth * scale);
            const slotTopY = boardY;
            svg += \`<line x1="\${firstSlotStart}" y1="\${slotTopY}" x2="\${firstSlotEnd}" y2="\${slotTopY}" stroke="\${slotWidthColor}" stroke-width="3"/>\`;

            // Add colored border indicator for board thickness (on right side of first slot, vertical)
            const boardThicknessColor = '#9B59B6'; // Purple color for board thickness
            const fingerTopY = boardTopY;
            svg += \`<line x1="\${firstSlotEnd}" y1="\${fingerTopY}" x2="\${firstSlotEnd}" y2="\${slotTopY}" stroke="\${boardThicknessColor}" stroke-width="3"/>\`;

            // Add colored border indicator for finger width (on top of first finger)
            const fingerWidthColor = '#2ECC71'; // Green color for finger width
            const firstFingerStart = pieceType === 'A' ? padding : (padding + slotWidth * scale);
            const firstFingerEnd = firstFingerStart + (fingerWidth * scale);
            svg += \`<line x1="\${firstFingerStart}" y1="\${fingerTopY}" x2="\${firstFingerEnd}" y2="\${fingerTopY}" stroke="\${fingerWidthColor}" stroke-width="3"/>\`;

            svg += '</svg>';

            // Add legend at the top
            const unit = 'mm';
            const legendHTML = \`
              <div style="font-size: 14px; font-family: system-ui; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 30px; height: 4px; background: \${stockWidthColor};"></div>
                  <span style="color: \${stockWidthColor}; font-weight: 500;">Board Width: \${boardWidthInput.toFixed(1)} \${unit}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 30px; height: 4px; background: \${slotWidthColor};"></div>
                  <span style="color: \${slotWidthColor}; font-weight: 500;">Slot Width: \${slotWidth.toFixed(1)} \${unit}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 30px; height: 4px; background: \${fingerWidthColor};"></div>
                  <span style="color: \${fingerWidthColor}; font-weight: 500;">Finger Width: \${fingerWidth.toFixed(1)} \${unit}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 30px; height: 4px; background: \${boardThicknessColor};"></div>
                  <span style="color: \${boardThicknessColor}; font-weight: 500;">Board Thickness: \${boardThickness.toFixed(1)} \${unit}</span>
                </div>
              </div>
            \`;

            legendContainer.innerHTML = legendHTML;
            previewContainer.innerHTML = svg;
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
          ['boardWidth', 'boardThickness', 'fingerCount', 'fitTolerance', 'bitDiameter', 'pieceType'].forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
              input.addEventListener(fieldId === 'pieceType' ? 'change' : 'input', updateCalculatedDimensions);
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

            // Calculate finger width from board width and finger count
            // Piece A: fingerCount fingers + (fingerCount-1) slots = fingerCount*fw + (fingerCount-1)*(fw+ft) = bw
            // Piece B: fingerCount slots + (fingerCount-1) fingers = fingerCount*(fw+ft) + (fingerCount-1)*fw = bw
            // Both simplify to: (2*fingerCount - 1) * fw + numSlots * ft = bw
            // Determine number of slots based on piece type
            const numSlotsForCalc = pieceType === 'A' ? fingerCount - 1 : fingerCount;
            const fw = (bw - (numSlotsForCalc * ft)) / ((fingerCount * 2) - 1);

            const gcode = [];

            // Header
            gcode.push('(Box Joints - Piece ' + pieceType + ')');
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

            // Determine starting offset and number of slots based on piece type
            // Piece A: starts with finger, ends with finger → (fingerCount - 1) slots
            // Piece B: starts with slot, ends with slot → fingerCount slots
            const startOffset = pieceType === 'A' ? fw : 0;
            const numSlots = pieceType === 'A' ? fingerCount - 1 : fingerCount;

            // Calculate number of passes needed
            const numPasses = Math.ceil(bt / dpp);

            gcode.push('G53 G0 Z0 ; Move to machine Z0 (safe height)');
            gcode.push('');

            // Calculate bit and stepover parameters
            const bitRadius = bd / 2;
            const stepOver = bd * 0.4; // 40% stepover for better coverage
            const extraTravelY = 5 + bitRadius; // Extra travel beyond material face on Y axis
            const extraTravelX = bitRadius; // Extra travel on X axis to ensure clean edges
            const exitSlowdownZone = 3; // Slow down 3mm before exit to prevent tearout

            // Calculate how many X passes needed to clear slot width
            let numXPasses;
            if (slotWidth <= bd) {
              numXPasses = 1;
            } else {
              const remainingWidth = slotWidth - bd;
              numXPasses = 1 + Math.ceil(remainingWidth / stepOver);
            }

            // Process each slot completely (all depth layers)
            for (let i = 0; i < numSlots; i++) {
              // Each finger+slot pair takes up (fw + slotWidth) = (fw + fw + ft) = 2*fw + ft
              const slotStart = startOffset + (i * (fw + slotWidth));
              const slotEnd = slotStart + slotWidth;

              // Skip if slot goes significantly beyond board width (allow small rounding errors)
              if (slotEnd > bw + 0.2) break;

              gcode.push(\`; === Slot \${i + 1} ===\`);
              gcode.push('');

              // Box spiral parameters
              const frontY = -extraTravelY;
              const backY = bt + extraTravelY;
              const startLeftX = slotStart + bitRadius;
              const startRightX = slotEnd - bitRadius;

              // For each depth pass (layer by layer)
              for (let pass = 0; pass < numPasses; pass++) {
                const depth = -Math.min((pass + 1) * dpp, bt);

                gcode.push(\`; Layer \${pass + 1} at depth \${depth.toFixed(3)}mm\`);

                // Reset X positions for each layer
                let leftX = startLeftX;
                let rightX = startRightX;

                // Position to start of layer
                if (pass === 0) {
                  // First layer: rapid position and plunge
                  gcode.push(\`G0 X\${leftX.toFixed(3)} Y\${backY.toFixed(3)}\`);
                  gcode.push(\`G0 Z\${depth.toFixed(3)}\`);
                } else {
                  // Subsequent layers: move back to start, then plunge deeper
                  gcode.push(\`G0 X\${leftX.toFixed(3)} Y\${backY.toFixed(3)}\`);
                  gcode.push(\`G0 Z\${depth.toFixed(3)}\`);
                }

                // Spiral: back-front, right, front-back, left(inward), repeat
                while (leftX < rightX) {
                  // Left edge: back to front
                  gcode.push(\`G1 Y\${frontY.toFixed(3)} F\${fr.toFixed(1)}\`);

                  // Move to right edge
                  gcode.push(\`G1 X\${rightX.toFixed(3)}\`);

                  // Right edge: front to back
                  gcode.push(\`G1 Y\${backY.toFixed(3)}\`);

                  // Step both edges inward
                  leftX += stepOver;
                  rightX -= stepOver;

                  if (leftX >= rightX) break;

                  // Move to left edge (now inward)
                  gcode.push(\`G1 X\${leftX.toFixed(3)}\`);
                }

                gcode.push('');
              }

              // Z-hop after all layers complete before moving to next slot
              gcode.push('G0 Z5.0');

              gcode.push('');
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
            const filename = \`BoxJoint_\${displayValues.pieceType}_BT-\${displayValues.boardThickness}_BW-\${displayValues.boardWidth}_FC-\${displayValues.fingerCount}_DPP-\${displayValues.depthPerPass}.nc\`;
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
  });
}

export async function onUnload(ctx) {
  ctx.log('BoxJoints plugin unloaded');
}
