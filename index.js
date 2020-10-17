const exampleGraph =  {
    "A": {
        "children": ["B","C"],
        "duration": 6,
        "earliestStart": 0,
        "earliestEnd": 0,
        "latestStart": 0,
        "latestEnd": 0,
    },
    "B": {
        "children": ["D","E"],
        "duration": 3
    },
    "C": {
        "children": ["F"],
        "duration": 1
    },
    "D": {
        "children": ["G"],
        "duration": 1
    },
    "E": {
        "children": ["F"],
        "duration": 2
    },
    "F": {
        "children": ["G"],
        "duration": 1
    },
    "G": {
        "children": [],
        "duration": 1
    }
};

function calcForwardGraph(graphJSON, startNodeLabel){
    let startNode = graphJSON[startNodeLabel];
    startNode.earliestStart = 0;
    startNode.earliestEnd = startNode.duration;
    startNode.latestStart = 0;
    startNode.latestEnd = startNode.duration;
    graphJSON[startNodeLabel] = startNode;

    let listOfImpoveableNodes = [startNodeLabel];

    while(listOfImpoveableNodes.length > 0){
        let liftOfNextImproveableNodes = [];
        for(let i=0; i<listOfImpoveableNodes.length; i++){
            let parentLabel = listOfImpoveableNodes[i];
            let parent = graphJSON[parentLabel];

            let children = parent.children || [];
            parent.children = children;
            graphJSON[parentLabel] = parent;

            for(let j=0; j<children.length; j++){
                let childLabel = children[j];
                let child = graphJSON[childLabel];

                let parents = child.parents || [];
                parents.push(parentLabel);
                child.parents = parents;

                let childsEarliestStart = child.earliestStart;
                if(!childsEarliestStart || childsEarliestStart < parent.earliestEnd){
                    childsEarliestStart = parent.earliestEnd;
                    liftOfNextImproveableNodes.push(childLabel);
                }
                child.earliestStart = childsEarliestStart;
                child.earliestEnd = childsEarliestStart + child.duration;

                graphJSON[childLabel] = child;
            }
        }
        listOfImpoveableNodes = liftOfNextImproveableNodes;
    }

    return graphJSON;
}

function calcBackwardGraph(graphJSON){
    let listOfLeafes = getAllLeafes(graphJSON);
    for(let i=0; i<listOfLeafes.length; i++){
        let endNodeLabel = listOfLeafes[i];
        graphJSON = calcBackwardGraphForEndlabel(graphJSON, endNodeLabel);
    }
    return graphJSON;
}

function calcBackwardGraphForEndlabel(graphJSON, endNodeLabel){
    let endNode = graphJSON[endNodeLabel];
    endNode.latestEnd = endNode.earliestEnd;
    endNode.latestStart = endNode.earliestStart;
    endNode.buffer = 0;
    graphJSON[endNodeLabel] = endNode;

    let listOfImpoveableNodes = [endNodeLabel];

    while(listOfImpoveableNodes.length > 0){
        let liftOfNextImproveableNodes = [];
        for(let i=0; i<listOfImpoveableNodes.length; i++){
            let childLabel = listOfImpoveableNodes[i];
            let child = graphJSON[childLabel];

            let parents = child.parents;

            for(let j=0; j<parents.length; j++){
                let parentLabel = parents[j];
                let parent = graphJSON[parentLabel];

                let parentsLatestEnd = parent.latestEnd;
                if(!parentsLatestEnd || parentsLatestEnd > child.latestStart){
                    parentsLatestEnd = child.latestStart;
                    liftOfNextImproveableNodes.push(parentLabel);
                }
                parent.latestEnd = parentsLatestEnd;
                parent.latestStart = parentsLatestEnd - parent.duration;
                parent.buffer = parent.latestEnd - parent.earliestEnd;

                graphJSON[parentLabel] = parent;
            }
        }
        listOfImpoveableNodes = liftOfNextImproveableNodes;
    }

    return graphJSON;
}

function getCriticalPaths(graphJSON, startNodeLabel){
    let criticalPaths = [];
    let parent = graphJSON[startNodeLabel];
    if(parent.buffer===0){
        let children = parent.children;
        if(children.length > 0){
            for(let i=0; i<children.length; i++){
                let childLabel = children[i];
                let childsCriticalPaths = getCriticalPaths(graphJSON, childLabel);
                for(let j=0; j<childsCriticalPaths.length; j++){
                    let childsCriticalPath = childsCriticalPaths[j];
                    let completedChildsCriticalPath = [startNodeLabel].concat(childsCriticalPath);
                    criticalPaths.push(completedChildsCriticalPath);
                }
            }
            return criticalPaths;
        } else {
            return [startNodeLabel];
        }
    }
    return criticalPaths;
}

function getAllLeafes(graphJSON){
    let listOfLeafes = [];
    let allNodeLabels = Object.keys(graphJSON);
    for(let i=0; i<allNodeLabels.length; i++){
        let nodeLabel = allNodeLabels[i];
        let node = graphJSON[nodeLabel];
        if(node.children.length === 0){
            listOfLeafes.push(nodeLabel);
        }
    }
    return listOfLeafes;
}

function init(graphJSON, startNodeLabel) {
    graphJSON = calcForwardGraph(graphJSON, startNodeLabel);
    graphJSON = calcBackwardGraph(graphJSON);
    return graphJSON;
}

module.exports.init = init;
module.exports.getCriticalPaths = getCriticalPaths;
