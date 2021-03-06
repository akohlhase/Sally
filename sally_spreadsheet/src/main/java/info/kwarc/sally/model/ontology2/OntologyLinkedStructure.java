package info.kwarc.sally.model.ontology2;

import info.kwarc.sally.model.document.spreadsheet.ASMInterface;
import info.kwarc.sally.model.document.spreadsheet.AbstractSsElement;

import java.util.List;

import com.hp.hpl.jena.rdf.model.Model;

public interface OntologyLinkedStructure {
	
	public void exportIntoModel(Model model, OntologyMapping mapping, ASMInterface modelAdmin);
	
	public String getURI(AbstractSsElement el);

	public AbstractSsElement getElement(String uri);

	public List<String> getAllURIs();
	
	public String getMainURI();

}
