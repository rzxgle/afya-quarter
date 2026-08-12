PROJECT_OPTIONS = {
    "Todos os projetos": None,

    "VS Aprender": [
        "APR"
    ],
    
    "VS Descobrir": [
        "DESC"
    ],
    
     "VS Conversão": [
        "CONV"
    ],
     
    "VS Core": [
        "COREX"
    ],
    
    "VS APP": [
        "APP"
    ],
}


def get_project_options():
    return PROJECT_OPTIONS


def get_project_views(project_options):
    return list(project_options.keys())


def get_projects_for_view(project_options, selected_view):
    return project_options.get(selected_view)
