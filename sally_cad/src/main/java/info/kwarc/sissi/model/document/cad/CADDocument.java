package info.kwarc.sissi.model.document.cad;

import info.kwarc.sally.core.SallyContext;
import info.kwarc.sally.core.SallyInteraction;
import info.kwarc.sally.core.SallyInteractionResultAcceptor;
import info.kwarc.sally.core.SallyService;
import info.kwarc.sally.core.comm.SallyMenuItem;
import info.kwarc.sally.core.comm.SallyModelRequest;
import info.kwarc.sally.networking.interfaces.IMessageCallback;
import info.kwarc.sally.networking.interfaces.INetworkSender;

import java.util.List;

import sally.CADAlexClick;
import sally.CADNavigateTo;
import sally.CADNode;
import sally.CADSemanticData;
import sally.MMTUri;
import sally.SwitchToApp;

import com.google.inject.Inject;
import com.google.inject.assistedinject.Assisted;
import com.hp.hpl.jena.rdf.model.Model;

public class CADDocument {
	ACMInterface acm;
	CADSemanticData data;
	String filePath;
	INetworkSender sender;
	
	public String getFilePath() {
		return filePath;
	}

	public void switchToApp() {
		SwitchToApp request = SwitchToApp.newBuilder().setFileName(filePath).build();
		sender.sendMessage("/do/switch", request, new IMessageCallback() {
			
			@Override
			public void onMessage() {
				
			}
		});
	}
	
	public void selectRange(CADNavigateTo navigateTo) {
		sender.sendMessage("/do/select", navigateTo, new IMessageCallback() {
			@Override
			public void onMessage() {
				
			}
		});
	}
	
	@Inject
	public CADDocument(@Assisted String filePath, @Assisted CADSemanticData data, @Assisted INetworkSender sender) {
		this.sender = sender;
		this.filePath = filePath;
		acm = new ACMInterface(data.getFileName());
		this.data = data;
		init();
	}
	
	public void init() {
		acm.setRootNode(data.getRootNode());
		acm.reindex();
	}

	@SallyService(channel="/get/semantics")
	public void getModel(SallyModelRequest click, SallyInteractionResultAcceptor acceptor, SallyContext context) {
		acceptor.acceptResult(acm.getRDFModel());
	}

	@SallyService(channel="/what")
	public void getIMMapping(CADAlexClick click, SallyInteractionResultAcceptor acceptor, SallyContext context) {
		CADNode node = acm.getNodeById(click.getCadNodeId());
		if (node == null)
			return;
		
		MMTUri uri = MMTUri.newBuilder().setUri(node.getImUri()).build();
		
		List<SallyMenuItem> items = context.getCurrentInteraction().getPossibleInteractions(uri, SallyMenuItem.class);
		for (SallyMenuItem item : items) {
			acceptor.acceptResult(item);
		}
	}

	
	@SallyService(channel="/service/alex/selectRange")
	public void getSemantics(CADAlexClick click, SallyInteractionResultAcceptor acceptor, SallyContext context) {
		if (!click.getFileName().equals(acm.getDocumentURI())) {
			return;
		}
		final SallyInteraction interaction = context.getCurrentInteraction();

		context.setContextVar("preferred_position", click.getPosition());
		
		String nodeId = click.getCadNodeId();
		
		CADNode cadNode = acm.getNodeById(nodeId);
		if (cadNode == null)
			return;
				
		MMTUri mmtURI = MMTUri.newBuilder().setUri(cadNode.getImUri()).build();
		
		List<SallyMenuItem> items = interaction.getPossibleInteractions(mmtURI, SallyMenuItem.class);
		SallyMenuItem item = interaction.getOneInteraction(items, SallyMenuItem.class);
		if (item != null) {
			item.run();
		}

	}

	public void setSemanticData(String fileName) {
		acm.importSemanticDataFile(fileName);
	}

	public Model getRDFModel() {
		return acm.getRDFModel();
	}

}
