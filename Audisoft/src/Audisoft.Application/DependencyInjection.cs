using Audisoft.Application.Interfaces;
using Audisoft.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Audisoft.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ITeacherService, TeacherService>();
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<ISubjectService, SubjectService>();
        services.AddScoped<IGradeService, GradeService>();
        return services;
    }
}
