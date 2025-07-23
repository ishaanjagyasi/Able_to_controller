// bipolar_knob_painter.js - For use with live.dial @jspainter
// Creates a bipolar knob similar to hardware octave controls

// Configuration
var knobRadius = 0.35;  // Relative to widget size
var indicatorLength = 0.25;
var indicatorWidth = 0.04;

// Colors (RGB values 0-1)
var knobColor = [0.15, 0.15, 0.15];     // Dark gray knob body
var borderColor = [0.4, 0.4, 0.4];      // Lighter border
var indicatorColor = [0.9, 0.9, 0.9];   // White indicator
var centerDotColor = [0.6, 0.6, 0.6];   // Center dot
var textColor = [0.7, 0.7, 0.7];        // Text color
var backgroundColor = [0.1, 0.1, 0.1];  // Background

function paint(g, value) {
    var width = box.rect[2] - box.rect[0];
    var height = box.rect[3] - box.rect[1];
    var size = Math.min(width, height);
    var centerX = width * 0.5;
    var centerY = height * 0.5;
    var radius = size * knobRadius;
    
    // Clear background
    g.set_source_rgba(backgroundColor[0], backgroundColor[1], backgroundColor[2], 1.0);
    g.rectangle(0, 0, width, height);
    g.fill();
    
    // Draw knob body (main circle)
    g.set_source_rgba(knobColor[0], knobColor[1], knobColor[2], 1.0);
    g.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    g.fill();
    
    // Draw knob border
    g.set_source_rgba(borderColor[0], borderColor[1], borderColor[2], 1.0);
    g.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    g.set_line_width(size * 0.02);
    g.stroke();
    
    // Draw inner circle (slight indentation effect)
    g.set_source_rgba(knobColor[0] * 0.7, knobColor[1] * 0.7, knobColor[2] * 0.7, 1.0);
    g.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI);
    g.fill();
    
    // Calculate indicator angle based on value
    // Value comes in as 0-1, convert to bipolar (-1 to +1)
    var bipolarValue = (value * 2) - 1;  // Convert 0-1 to -1 to +1
    var angle = bipolarValue * 135 * Math.PI / 180; // ±135 degrees in radians
    
    // Draw indicator line
    var startRadius = size * 0.08;
    var endRadius = radius * 0.85;
    var startX = centerX + Math.sin(angle) * startRadius;
    var startY = centerY - Math.cos(angle) * startRadius;
    var endX = centerX + Math.sin(angle) * endRadius;
    var endY = centerY - Math.cos(angle) * endRadius;
    
    g.set_source_rgba(indicatorColor[0], indicatorColor[1], indicatorColor[2], 1.0);
    g.set_line_width(size * indicatorWidth);
    g.move_to(startX, startY);
    g.line_to(endX, endY);
    g.stroke();
    
    // Draw center dot
    g.set_source_rgba(centerDotColor[0], centerDotColor[1], centerDotColor[2], 1.0);
    g.arc(centerX, centerY, size * 0.03, 0, 2 * Math.PI);
    g.fill();
    
    // Draw scale marks
    drawScaleMarks(g, centerX, centerY, radius, size);
    
    // Draw bipolar labels
    drawLabels(g, centerX, centerY, radius, size);
}

function drawScaleMarks(g, centerX, centerY, radius, size) {
    g.set_source_rgba(textColor[0], textColor[1], textColor[2], 0.6);
    g.set_line_width(size * 0.015);
    
    // Draw marks at key positions (in degrees)
    var positions = [-135, -90, -45, 0, 45, 90, 135];
    var markLength = size * 0.06;
    var markRadius = radius + size * 0.08;
    
    for (var i = 0; i < positions.length; i++) {
        var angle = positions[i] * Math.PI / 180;
        var x1 = centerX + Math.sin(angle) * markRadius;
        var y1 = centerY - Math.cos(angle) * markRadius;
        var x2 = centerX + Math.sin(angle) * (markRadius + markLength);
        var y2 = centerY - Math.cos(angle) * (markRadius + markLength);
        
        // Make center mark (0) more prominent
        if (positions[i] === 0) {
            g.set_line_width(size * 0.025);
        } else {
            g.set_line_width(size * 0.015);
        }
        
        g.move_to(x1, y1);
        g.line_to(x2, y2);
        g.stroke();
    }
}

function drawLabels(g, centerX, centerY, radius, size) {
    g.set_source_rgba(textColor[0], textColor[1], textColor[2], 0.8);
    g.select_font_face("Arial");
    g.set_font_size(size * 0.12);
    
    var labelRadius = radius + size * 0.25;
    
    // Minus label (left side, -90 degrees)
    var minusAngle = -90 * Math.PI / 180;
    var minusX = centerX + Math.sin(minusAngle) * labelRadius;
    var minusY = centerY - Math.cos(minusAngle) * labelRadius;
    
    // Center the text
    var textExtents = g.text_extents("-");
    g.move_to(minusX - textExtents.width/2, minusY + textExtents.height/2);
    g.show_text("-");
    
    // Plus label (right side, +90 degrees)
    var plusAngle = 90 * Math.PI / 180;
    var plusX = centerX + Math.sin(plusAngle) * labelRadius;
    var plusY = centerY - Math.cos(plusAngle) * labelRadius;
    
    textExtents = g.text_extents("+");
    g.move_to(plusX - textExtents.width/2, plusY + textExtents.height/2);
    g.show_text("+");
    
    // Center zero label
    g.set_font_size(size * 0.1);
    textExtents = g.text_extents("0");
    g.move_to(centerX - textExtents.width/2, centerY + radius + size * 0.4);
    g.show_text("0");
}