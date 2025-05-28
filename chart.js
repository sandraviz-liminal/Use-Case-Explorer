  // --------------------------------------
  //  Canvas
  // --------------------------------------

  const margin = { top: 300, right: 200, bottom: 30, left: 350 };
  const width = 2000;
  const height = 3500;
  const innerwidth = width - margin.left - margin.right;
  const innerheight = height - margin.top - margin.bottom;

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  const innerChart = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// --------------------------------------
// Tooltip 
// --------------------------------------

const tooltip = d3.tip()
.attr("class", "tooltip")
.offset([-10, 0])
.html((event, d) => `
  <div class="tooltip-wrapper">
    <div class="tooltip-title">${d.products}</div>
    <div class="tooltip-section">
      <div class="tooltip-label">Requirement</div>
      <div class="tooltip-value">${d.Requirement}</div>
    </div>
    <div class="tooltip-section">
      <div class="tooltip-label">Capability</div>
      <div class="tooltip-value">${d.Capability}</div>
    </div>
  </div>
`);

innerChart.call(tooltip);

// --------------------------------------
// Data loading
// --------------------------------------

// d3.json("data/Age_Estimation.json").then(json => {
 d3.json("data/Chargeback_Management.json").then(json => {
// d3.json("data/Chargeback_Fraud.json").then(json => {

  const data = [];
  const header = [];

  const seenRequirements = new Set();

  json.productRequirements.forEach(req => {
    const requirementName = req.name;
    let isFirstRequirement = !seenRequirements.has(requirementName);

    req.productCapabilities.forEach(cap => {
      const capabilityId = `Cap${cap.id}`;
      const capabilityName = cap.name;
      const importance = cap.importance;

      // Add to data array
      cap.products.forEach(product => {
        data.push({
          products: product.name,
          Requirement: requirementName,
          Capability: capabilityName,
          ID: capabilityId,
          Requirement2: "",       
          Requirement3: "",         
          Importance: importance,
          values: product.importanceValue,
          sum: product.importanceValue
        });
      });

      // Add to header array with conditional Requirement2 and Requirement3
      header.push({
        ID: capabilityId,
        Requirement: requirementName,
        Capability: capabilityName,
        Requirement2: isFirstRequirement ? requirementName : "",
        Requirement3: isFirstRequirement ? capabilityId : "",
        Importance: importance
      });

      seenRequirements.add(requirementName);
      isFirstRequirement = false;
    });
  });

  console.log("Header:", header);
  console.log("Data:", data);

  // --------------------------------------
  // Scales
  // --------------------------------------

  const IDs = [...new Set(data.flatMap((d) => d.ID))]; 
  const Requirement = [...new Set(data.flatMap((d) => d.Requirement))];
  const Products = [...new Set(data.flatMap((d) => d.products).sort((d) => d.sum))];
  const Capabilities = header.map((d) => d.Capability)

  const x = d3.scalePoint(IDs, [0, innerwidth]);
  const c = d3.scaleOrdinal(Requirement, ["#51A5F2", "#B1B561", "#F2A0D5", "#4CCAD0", "#AB89DB"]);
  const y = d3.scalePoint(Products, [0, innerheight]);
  const r = d3.scaleSqrt([0, 2, 3, 4], [0, 0, 2, 7]);
  const o = d3.scaleLinear([0, 2, 3, 4], [0, 1, 1, 1]);

  // --------------------------------------
  // Axes
  // --------------------------------------

  innerChart
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,0)`)
    .call(
      d3
        .axisBottom()
        .scale(x)
        .tickSize(0)
        .tickFormat(() => "")
    )
    .select(".domain")
    .remove();

  innerChart
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(-300,0)`)
    .call(d3.axisRight().scale(y).tickSize(0))
    .attr("text-anchor", "start")
    .select(".domain")
    .remove();

  // Interactivity: highlighting

  innerChart.selectAll(".y-axis text")
    .style("cursor", "pointer")
    .on("mouseover", function(event, product) {
      d3.selectAll("circle")
        .style("opacity", function() {
          return d3.select(this).attr("data-product") === product ? 1 : 0.2;
        });
    })
    .on("mouseout", function() {
      d3.selectAll("circle").style("opacity", null); 
    });

// --------------------------------------
// Drawing header 
// --------------------------------------

const labelY = -85, labelAngle = -50;

  innerChart.selectAll("text.text1")
  .data(header)
  .join("text")
  .attr("class", "text1")
  .attr("x", d => x(d.ID))
  .attr("y", labelY)
  .attr("transform", d => `rotate(${labelAngle}, ${x(d.ID)}, ${labelY})`)
  .text(d => d.Capability);

  innerChart
    .selectAll("text.text2")
    .data(header)
    .join("text")
    .attr("class", "text2")
    .attr("x", (d) => x(d.Requirement3) -10)
    .attr("y", -30)
    .attr("fill", (d) => c(d.Requirement))
    .text((d) => d.Requirement2);

  innerChart
    .selectAll("line.line")
    .data(header)
    .join("line")
    .attr("class", "line")
    .attr("x1", (d) => x(d.Requirement3) - 10)
    .attr("x2", (d) => x(d.Requirement3) + 60)
    .attr("y1", -50)
    .attr("y2", -50)
    .attr("stroke", (d) => c(d.Requirement));

  innerChart
    .selectAll("circle.circle1")
    .data(header)
    .attr("class", "circle1")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", -70)
    .attr("r", (d) => r(d.Importance))
    .attr("fill", (d) => c(d.Requirement))
    .attr("opacity", (d) => o(d.Importance));

  innerChart
    .selectAll("circle2")
    .data(header)
    .attr("class", "circle.circle2")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", -70)
    .attr("r", 7)
    .attr("stroke", (d) => c(d.Requirement))
    .attr("stroke-width", 1.4)
    .attr("fill", "none");

// --------------------------------------
// Drawing matrix 
// --------------------------------------

const sortedData = data.slice().sort((a, b) => a.sum - b.sum);

// All background circles 

  innerChart
    .selectAll("circle.circle3")
    .data(sortedData)
    .attr("class", "circle3")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", (d) => y(d.products))
    .attr("r", 7)
    .attr("stroke", "#F9F4F2")
    .attr("stroke-width", 1.4)
    .attr("fill", "#F9F4F2")
    .attr("opacity", 0.8);

  innerChart
    .selectAll("circle.circle4")
    .data(sortedData)
    .attr("class", "circle4")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", (d) => y(d.products))
    .attr("r", (d) => r(d.values))
    .attr("fill", (d) => c(d.Requirement))
    .attr("opacity", (d) => o(d.values))
    .attr("data-product", d => d.products)
    .on("mouseover", tooltip.show)
    .on("mouseout", tooltip.hide);

  innerChart
    .selectAll("circle.circle5")
    .data(sortedData)
    .attr("class", "circle5")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", (d) => y(d.products))
    .attr("r", 7)
    .attr("stroke", (d) => c(d.Requirement))
    .attr("stroke-width", 1.4)
    .attr("fill", "none")
    .attr("opacity", (d) => o(d.values))
    .attr("data-product", d => d.products)
    .on("mouseover", tooltip.show)
    .on("mouseout", tooltip.hide);

});