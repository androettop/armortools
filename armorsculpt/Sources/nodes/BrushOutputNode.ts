
// @:keep
class BrushOutputNode extends LogicNode {

	Directional = false; // button 0

	constructor() {
		super();
		Context.raw.runBrush = run;
		Context.raw.parseBrushInputs = parseInputs;
	}

	parseInputs = () => {
		let lastMask = Context.raw.brushMaskImage;
		let lastStencil = Context.raw.brushStencilImage;

		let input0: any;
		let input1: any;
		let input2: any;
		let input3: any;
		let input4: any;
		try {
			inputs[0].get((value) => { input0 = value; });
			inputs[1].get((value) => { input1 = value; });
			inputs[2].get((value) => { input2 = value; });
			inputs[3].get((value) => { input3 = value; });
			inputs[4].get((value) => { input4 = value; });
		}
		catch (_) {
			return;
		}

		Context.raw.paintVec = input0;
		Context.raw.brushNodesRadius = input1;

		let opac: any = input2; // Float or texture name
		if (opac == null) opac = 1.0;
		if (typeof opac == "string") {
			Context.raw.brushMaskImageIsAlpha = opac.endsWith(".a");
			opac = opac.substr(0, opac.lastIndexOf("."));
			Context.raw.brushNodesOpacity = 1.0;
			let index = Project.assetNames.indexOf(opac);
			let asset = Project.assets[index];
			Context.raw.brushMaskImage = Project.getImage(asset);
		}
		else {
			Context.raw.brushNodesOpacity = opac;
			Context.raw.brushMaskImage = null;
		}

		Context.raw.brushNodesHardness = input3;

		let stencil: any = input4; // Float or texture name
		if (stencil == null) stencil = 1.0;
		if (typeof stencil == "string") {
			Context.raw.brushStencilImageIsAlpha = stencil.endsWith(".a");
			stencil = stencil.substr(0, stencil.lastIndexOf("."));
			let index = Project.assetNames.indexOf(stencil);
			let asset = Project.assets[index];
			Context.raw.brushStencilImage = Project.getImage(asset);
		}
		else {
			Context.raw.brushStencilImage = null;
		}

		if (lastMask != Context.raw.brushMaskImage ||
			lastStencil != Context.raw.brushStencilImage) {
			MakeMaterial.parsePaintMaterial();
		}

		Context.raw.brushDirectional = Directional;
	}

	run = (from: i32) => {
		let left = 0.0;
		let right = 1.0;
		if (Context.raw.paint2d) {
			left = 1.0;
			right = (Context.raw.splitView ? 2.0 : 1.0) + UIView2D.inst.ww / Base.w();
		}

		// First time init
		if (Context.raw.lastPaintX < 0 || Context.raw.lastPaintY < 0) {
			Context.raw.lastPaintVecX = Context.raw.paintVec.x;
			Context.raw.lastPaintVecY = Context.raw.paintVec.y;
		}

		// Do not paint over fill layer
		let fillLayer = Context.raw.layer.fill_layer != null;

		// Do not paint over groups
		let groupLayer = Context.raw.layer.isGroup();

		// Paint bounds
		if (Context.raw.paintVec.x > left &&
			Context.raw.paintVec.x < right &&
			Context.raw.paintVec.y > 0 &&
			Context.raw.paintVec.y < 1 &&
			!fillLayer &&
			!groupLayer &&
			(Context.raw.layer.isVisible() || Context.raw.paint2d) &&
			!UIBase.inst.ui.isHovered &&
			!Base.isDragging &&
			!Base.isResizing &&
			!Base.isScrolling() &&
			!Base.isComboSelected()) {

			let down = Input.getMouse().down() || Input.getPen().down();

			// Prevent painting the same spot
			let sameSpot = Context.raw.paintVec.x == Context.raw.lastPaintX && Context.raw.paintVec.y == Context.raw.lastPaintY;
			let lazy = Context.raw.tool == ToolBrush && Context.raw.brushLazyRadius > 0;
			if (down && (sameSpot || lazy)) {
				Context.raw.painted++;
			}
			else {
				Context.raw.painted = 0;
			}
			Context.raw.lastPaintX = Context.raw.paintVec.x;
			Context.raw.lastPaintY = Context.raw.paintVec.y;

			if (Context.raw.tool == ToolParticle) {
				Context.raw.painted = 0; // Always paint particles
			}

			if (Context.raw.painted == 0) {
				parseInputs();
			}

			if (Context.raw.painted == 0) {
				Context.raw.pdirty = 1;
				Context.raw.rdirty = 2;
				History.pushUndo2 = true; ////
			}
		}
	}
}